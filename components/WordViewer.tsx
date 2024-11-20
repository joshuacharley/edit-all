"use client";
import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { useDocumentStore } from '@/store/documentStore';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const Editor = dynamic(
  () => import('@/components/ui/editor').then((mod) => mod.Editor),
  { ssr: false }
);

interface WordViewerProps {
  docData: ArrayBuffer;
  documentId: string;
}

export function WordViewer({ docData, documentId }: WordViewerProps) {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateDocument } = useDocumentStore();

  useEffect(() => {
    const loadDocument = async () => {
      try {
        // Ensure we have valid data
        if (!docData || docData.byteLength === 0) {
          throw new Error('Invalid document data');
        }

        // Convert ArrayBuffer to Uint8Array and handle potential corruption
        const uint8Array = new Uint8Array(docData);
        if (uint8Array.length === 0) {
          throw new Error('Document data is empty');
        }

        // Verify document structure (basic check for Word document signature)
        const signature = uint8Array.slice(0, 4);
        const isValidSignature = signature[0] === 0x50 && signature[1] === 0x4B && 
                                signature[2] === 0x03 && signature[3] === 0x04;
        
        if (!isValidSignature) {
          throw new Error('Invalid Word document format');
        }

        const result = await mammoth.convertToHtml(
          { arrayBuffer: uint8Array.buffer },
          {
            styleMap: [
              "p[style-name='Section Title'] => h1:fresh",
              "p[style-name='Subsection Title'] => h2:fresh"
            ]
          }
        );

        if (result.messages.length > 0) {
          console.log('Conversion messages:', result.messages);
        }

        setContent(result.value);
        setError(null);
      } catch (err) {
        console.error('Error loading Word document:', err);
        setError('Failed to load document. Please make sure it is a valid Word file.');
        setContent('');
      }
    };

    loadDocument();
  }, [docData]);

  const handleSave = async (newContent: string) => {
    try {
      // For now, we'll store the HTML content directly
      // In a production app, you'd want to convert HTML back to DOCX
      const encoder = new TextEncoder();
      const buffer = encoder.encode(newContent).buffer;
      updateDocument(documentId, buffer);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Failed to save document changes.');
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        {error}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-4 text-gray-500">
        Loading document...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "destructive" : "default"}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {isEditing ? (
        <Editor
          initialContent={content}
          onSave={handleSave}
        />
      ) : (
        <div
          className="prose max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}
