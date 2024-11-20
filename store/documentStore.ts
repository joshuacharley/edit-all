import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Document {
  _id?: string;
  name: string;
  type: 'pdf' | 'excel' | 'word';
  content: ArrayBuffer;
  lastModified: Date;
}

interface DocumentStore {
  documents: Document[];
  currentDocument: Document | null;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Omit<Document, '_id'>) => void;
  removeDocument: (documentId: string) => void;
  setCurrentDocument: (document: Document | null) => void;
  updateDocument: (documentId: string, content: ArrayBuffer) => void;
  loadDocuments: () => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDocument: null,

      setDocuments: (documents) => set({ documents }),

      addDocument: async (document) => {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([document.content]), document.name);

          const response = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to save document');
          }

          const savedDocument = await response.json();
          set((state) => ({
            documents: [...state.documents, savedDocument],
          }));
        } catch (error) {
          console.error('Error adding document:', error);
          throw error;
        }
      },

      removeDocument: (documentId) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc._id !== documentId),
          currentDocument:
            state.currentDocument?._id === documentId ? null : state.currentDocument,
        }));
      },

      setCurrentDocument: (document) => set({ currentDocument: document }),

      updateDocument: async (documentId, content) => {
        try {
          const response = await fetch('/api/documents', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ documentId, content }),
          });

          if (!response.ok) {
            throw new Error('Failed to update document');
          }

          const updatedDocument = await response.json();
          set((state) => ({
            documents: state.documents.map((doc) =>
              doc._id === documentId ? updatedDocument : doc
            ),
            currentDocument:
              state.currentDocument?._id === documentId
                ? updatedDocument
                : state.currentDocument,
          }));
        } catch (error) {
          console.error('Error updating document:', error);
          throw error;
        }
      },

      loadDocuments: async () => {
        try {
          const response = await fetch('/api/documents');
          if (!response.ok) {
            throw new Error('Failed to load documents');
          }
          const documents = await response.json();
          set({ documents });
        } catch (error) {
          console.error('Error loading documents:', error);
          throw error;
        }
      },
    }),
    {
      name: 'document-storage',
      partialize: (state) => ({
        documents: state.documents.map(({ content, ...rest }) => rest),
      }),
    }
  )
);
