"use client";

import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { format } from 'date-fns';

export function DocumentList() {
  const { documents, removeDocument, setCurrentDocument } = useDocumentStore();

  const getFileIcon = (type: 'pdf' | 'excel' | 'word') => {
    switch (type) {
      case 'pdf':
        return <FileType className="h-5 w-5 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'word':
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatDate = (date: Date | string | number) => {
    const parsedDate = new Date(date);
    return format(parsedDate, 'MMM d, yyyy h:mm a');
  };

  const handleDelete = async (documentId: string) => {
    try {
      // Call API to delete document
      const response = await fetch(`/api/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove from local state
      removeDocument(documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  if (!documents.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No documents uploaded yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            // Create a unique key using document properties
            const docId = doc._id || `temp-${doc.name}-${Date.now()}`;
            
            return (
              <TableRow key={docId}>
                <TableCell>{getFileIcon(doc.type)}</TableCell>
                <TableCell>
                  <button
                    className="hover:underline text-left"
                    onClick={() => setCurrentDocument(doc)}
                  >
                    {doc.name}
                  </button>
                </TableCell>
                <TableCell>
                  {formatDate(doc.lastModified)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(docId)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
