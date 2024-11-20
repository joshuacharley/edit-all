"use client";
import { Button } from "@/components/ui/button";
import { Upload, FileText, FileSpreadsheet, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useCallback } from 'react';
import { FileViewer } from '@/components/FileViewer';
import { DocumentList } from '@/components/DocumentList';
import { useDocumentStore } from '@/store/documentStore';

export default function Home() {
  const { addDocument, currentDocument, setCurrentDocument } = useDocumentStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const getFileType = (fileName: string): 'pdf' | 'excel' | 'word' | null => {
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return 'excel';
    if (['.docx', '.doc', '.dotx', '.dot', '.docm', '.dotm', '.odt']
        .some(ext => fileName.toLowerCase().endsWith(ext))) return 'word';
    return null;
  };

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const content = await file.arrayBuffer();
      const type = getFileType(file.name);
      
      if (!type) {
        alert('Unsupported file type');
        return;
      }
  
      addDocument({
        name: file.name,
        type,
        content,
        lastModified: new Date()
      });
    }
  }, [addDocument]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const content = await file.arrayBuffer();
      const type = getFileType(file.name);
      
      if (!type) {
        alert('Unsupported file type');
        return;
      }
  
      addDocument({
        name: file.name,
        type,
        content,
        lastModified: new Date()
      });
    }
  }, [addDocument]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Universal Document Editor</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Edit PDFs, Excel, Word documents and more - all in one place
        </p>
      </div>

      {/* Document List */}
      <div className="mb-8">
        <DocumentList />
      </div>

      {/* Upload Section */}
      {!currentDocument ? (
        <div className="mb-12">
          <Card
            className={`p-8 border-dashed border-2 ${
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
            } rounded-lg cursor-pointer hover:border-primary transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => onDrop([e.dataTransfer.files[0]])}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-lg font-medium">Drop your files here</p>
                <p className="text-sm text-gray-500">or</p>
                <label htmlFor="file-upload">
                  <Button className="mt-2" onClick={() => document.getElementById('file-upload')?.click()}>
                    Browse Files
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".xlsx,.xls,.pdf,.docx,.doc,.dotx,.dot,.docm,.dotm,.odt"
                />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mb-12">
          <Button 
            variant="outline" 
            onClick={() => setCurrentDocument(null)}
            className="mb-4"
          >
            ← Back to Documents
          </Button>
          <FileViewer
            file={currentDocument}
            onClose={() => setCurrentDocument(null)}
          />
        </div>
      )}

      {/* Supported Formats */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Supported Formats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <File className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-medium">PDF Documents</h3>
                <p className="text-sm text-gray-500">Edit and annotate PDFs</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-medium">Excel Spreadsheets</h3>
                <p className="text-sm text-gray-500">Modify Excel files online</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-medium">Word Documents</h3>
                <p className="text-sm text-gray-500">Edit Word files seamlessly</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}