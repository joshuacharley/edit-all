import { useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useDocumentStore } from '@/store/documentStore';

let socket: Socket | null = null;

export const useWebSocket = (documentId: string) => {
  const { updateDocument } = useDocumentStore();

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000');
    }

    socket.emit('join-document', documentId);

    socket.on('document-updated', ({ content, user }) => {
      updateDocument(documentId, content);
    });

    return () => {
      socket.emit('leave-document', documentId);
      socket.off('document-updated');
    };
  }, [documentId]);

  const emitChange = useCallback((content: any) => {
    if (socket) {
      socket.emit('document-change', {
        documentId,
        content,
        user: 'current-user' // Replace with actual user ID when auth is implemented
      });
    }
  }, [documentId]);

  return { emitChange };
};
