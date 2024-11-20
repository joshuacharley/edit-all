"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/store/documentStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Initialize pdf.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  pdfData: ArrayBuffer;
  documentId: string;
}

interface Annotation {
  x: number;
  y: number;
  text: string;
  type: 'text' | 'note';
}

export function PDFViewer({ pdfData, documentId }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const { updateDocument } = useDocumentStore();

  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfData) {
        setError('No PDF data provided');
        return;
      }

      try {
        // Load PDF using pdf.js
        const uint8Array = new Uint8Array(pdfData);
        const loadingTask = pdfjs.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setError(null);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
      }
    };

    loadPDF();
  }, [pdfData]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale]);

  const renderPage = async (pageNumber: number) => {
    if (!canvasRef.current || !pdfDoc) return;

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Get the PDF page
      const page = await pdfDoc.getPage(pageNumber);
      
      // Calculate scaled viewport
      const viewport = page.getViewport({ scale });
      
      // Set canvas dimensions to match the viewport
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      // Draw annotations
      annotations.forEach(annotation => {
        context.fillStyle = 'rgba(255, 255, 0, 0.3)';
        context.fillRect(annotation.x * scale, annotation.y * scale, 100, 20);
        context.fillStyle = 'black';
        context.font = '12px Arial';
        context.fillText(annotation.text, annotation.x * scale, annotation.y * scale + 15);
      });
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setError('Failed to render PDF page');
    }
  };

  const handleAddAnnotation = async (type: 'text' | 'note', event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newAnnotation: Annotation = {
      x: x / scale,
      y: y / scale,
      text: '',
      type
    };

    setAnnotations([...annotations, newAnnotation]);
    setSelectedAnnotation(newAnnotation);
  };

  const handleAnnotationTextChange = (text: string) => {
    if (!selectedAnnotation) return;

    const updatedAnnotations = annotations.map(ann =>
      ann === selectedAnnotation ? { ...ann, text } : ann
    );

    setAnnotations(updatedAnnotations);
    setSelectedAnnotation({ ...selectedAnnotation, text });
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>Zoom Out</Button>
          <Button onClick={() => setScale(s => Math.min(3, s + 0.2))}>Zoom In</Button>
          <Button onClick={(e: React.MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            handleAddAnnotation('text', e as React.MouseEvent<HTMLCanvasElement>);
          }}>Add Text</Button>
          <Button onClick={(e: React.MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            handleAddAnnotation('note', e as React.MouseEvent<HTMLCanvasElement>);
          }}>Add Note</Button>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onClick={(e: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if we clicked on an existing annotation
            const clickedAnnotation = annotations.find(ann => {
              const annX = ann.x * scale;
              const annY = ann.y * scale;
              return (
                x >= annX &&
                x <= annX + 100 &&
                y >= annY &&
                y <= annY + 20
              );
            });

            if (clickedAnnotation) {
              setSelectedAnnotation(clickedAnnotation);
            }
          }}
        />
      </div>

      {selectedAnnotation && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <Textarea
            value={selectedAnnotation.text}
            onChange={(e) => handleAnnotationTextChange(e.target.value)}
            placeholder="Enter annotation text..."
            className="w-64"
          />
          <Button
            onClick={() => setSelectedAnnotation(null)}
            className="mt-2"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
