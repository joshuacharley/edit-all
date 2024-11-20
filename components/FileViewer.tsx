"use client";
import { ExcelViewer } from './ExcelViewer';
import { PDFViewer } from './PDFViewer';
import { WordViewer } from './WordViewer';
import { Card } from "@/components/ui/card";
import { X } from 'lucide-react';
import { Document } from '@/store/documentStore';
import { EditToolbar } from './EditToolbar';

interface FileViewerProps {
  file: Document;
  onClose: () => void;
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const renderViewer = () => {
    switch (file.type) {
      case 'excel':
        return <ExcelViewer data={file.content} documentId={file.id} />;
      case 'pdf':
        return <PDFViewer pdfData={file.content} documentId={file.id} />;
      case 'word':
        return <WordViewer docData={file.content} documentId={file.id} />;
      default:
        return <div>Unsupported file type</div>;
    }
  };

  return (
    <Card className="p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{file.name}</h2>
        <EditToolbar documentId={file.id} />
      </div>
      {renderViewer()}
    </Card>
  );
}
