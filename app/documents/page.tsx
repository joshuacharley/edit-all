"use client";

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DocumentGrid } from '@/components/DocumentGrid';
import { ProgressIndicators, useProgressManager } from '@/components/ProgressIndicator';
import { useStore } from '@/store/documentStore';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

export default function DocumentsPage() {
  const { documents, loadDocuments, addDocument, updateDocuments } = useStore();
  const {
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
  } = useProgressManager();

  // Load documents when the page loads
  useEffect(() => {
    loadDocuments().catch(error => {
      console.error('Failed to load documents:', error);
    });
  }, [loadDocuments]);

  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const operationId = `upload-${file.name}-${Date.now()}`;
      startOperation(operationId, 'Uploading', file.name);

      try {
        const content = await file.arrayBuffer();
        await addDocument({
          name: file.name,
          type: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' :
                file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') ? 'excel' :
                'word',
          content: Buffer.from(content),
          lastModified: new Date(),
          history: [],
          currentHistoryIndex: 0,
        });

        completeOperation(operationId);
        // Documents will be automatically updated through the store
      } catch (error) {
        failOperation(operationId, error.message);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const handleOrderChange = async (reorderedDocs) => {
    try {
      await fetch('/api/documents/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: reorderedDocs }),
      });
      updateDocuments(reorderedDocs);
    } catch (error) {
      console.error('Error reordering documents:', error);
    }
  };

  return (
    <div {...getRootProps()} className="min-h-screen bg-background">
      <input {...getInputProps()} />
      
      <div className={cn(
        'fixed inset-0 pointer-events-none z-50',
        isDragActive && 'bg-primary/10'
      )}>
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-card p-8 rounded-lg shadow-lg border flex items-center gap-4">
              <Upload className="h-8 w-8 text-primary animate-bounce" />
              <div className="text-xl font-medium">Drop files to upload</div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Documents</h1>
          <ThemeToggle />
        </div>

        {documents.length > 0 ? (
          <DocumentGrid
            documents={documents}
            onOrderChange={handleOrderChange}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No documents yet. Drop files here or use the upload button to get started.</p>
          </div>
        )}
      </div>

      <ProgressIndicators />
    </div>
  );
}
