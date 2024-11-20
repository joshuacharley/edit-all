"use client";
import { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/store/documentStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const { updateDocument } = useDocumentStore();

  useEffect(() => {
    const loadPDF = async () => {
      const pdfDoc = await PDFDocument.load(pdfData);
      setTotalPages(pdfDoc.getPageCount());
      renderPage(currentPage);
    };
    loadPDF();
  }, [pdfData, currentPage]);

  const renderPage = async (pageNumber: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const pdfDoc = await PDFDocument.load(pdfData);
    const page = pdfDoc.getPage(pageNumber - 1);
    const { width, height } = page.getSize();

    canvas.width = width * scale;
    canvas.height = height * scale;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw PDF page
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const img = new Image();
    img.src = url;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    // Draw annotations
    annotations.forEach(annotation => {
      context.fillStyle = 'rgba(255, 255, 0, 0.3)';
      context.fillRect(annotation.x, annotation.y, 100, 20);
      context.fillStyle = 'black';
      context.font = '14px Arial';
      context.fillText(annotation.text.substring(0, 15) + '...', annotation.x + 5, annotation.y + 15);
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation: Annotation = {
      x,
      y,
      text: '',
      type: 'text'
    };

    setAnnotations([...annotations, newAnnotation]);
    setSelectedAnnotation(newAnnotation);
  };

  const handleAnnotationChange = (text: string) => {
    if (!selectedAnnotation) return;

    const updatedAnnotations = annotations.map(ann =>
      ann === selectedAnnotation ? { ...ann, text } : ann
    );

    setAnnotations(updatedAnnotations);
    setSelectedAnnotation({ ...selectedAnnotation, text });

    // Save to PDF
    savePDFWithAnnotations(updatedAnnotations);
  };

  const savePDFWithAnnotations = async (currentAnnotations: Annotation[]) => {
    const pdfDoc = await PDFDocument.load(pdfData);
    const page = pdfDoc.getPage(currentPage - 1);

    // Add annotations to PDF
    currentAnnotations.forEach(annotation => {
      page.drawText(annotation.text, {
        x: annotation.x / scale,
        y: page.getHeight() - (annotation.y / scale),
        size: 12,
      });
    });

    const modifiedPdfBytes = await pdfDoc.save();
    updateDocument(documentId, modifiedPdfBytes);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="space-x-2">
          <Button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setScale(s => s - 0.2)}>Zoom Out</Button>
          <Button onClick={() => setScale(s => s + 0.2)}>Zoom In</Button>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-crosshair"
        />
      </div>

      {selectedAnnotation && (
        <div className="space-y-2">
          <h3 className="font-medium">Edit Annotation</h3>
          <Textarea
            value={selectedAnnotation.text}
            onChange={(e) => handleAnnotationChange(e.target.value)}
            placeholder="Enter annotation text..."
            className="w-full"
          />
          <Button onClick={() => setSelectedAnnotation(null)}>Done</Button>
        </div>
      )}
    </div>
  );
}
