import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Document } from "@/models/document";

interface SearchFilters {
  tags?: string[];
  type?: "pdf" | "excel" | "word";
  category?: string;
}

interface DocumentStore {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchFilters: SearchFilters;

  // Actions
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Omit<Document, "_id">) => void;
  updateDocument: (id: string, content: ArrayBuffer) => void;
  setCurrentDocument: (document: Document | null) => void;
  deleteDocument: (id: string) => void;
  searchDocuments: (query: string, filters?: SearchFilters) => Promise<void>;
  loadDocuments: () => Promise<void>;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDocument: null,
      isLoading: false,
      error: null,
      searchQuery: "",
      searchFilters: {},

      setDocuments: (documents) => set({ documents }),

      addDocument: async (document) => {
        try {
          const formData = new FormData();
          formData.append("file", new Blob([document.content]), document.name);
          formData.append("type", document.type);

          const response = await fetch("/api/documents", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to save document");
          }

          const savedDocument = await response.json();
          // Convert ArrayBuffer to base64 for storage
          const documentWithBase64 = {
            ...savedDocument,
            content: arrayBufferToBase64(document.content),
          };

          set((state) => ({
            documents: [...state.documents, documentWithBase64],
          }));
        } catch (error) {
          console.error("Error adding document:", error);
          throw error;
        }
      },

      updateDocument: async (id, content) => {
        try {
          // Convert ArrayBuffer to base64 for API
          const base64Content = arrayBufferToBase64(content);

          const response = await fetch(`/api/documents?documentId=${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              documentId: id,
              content: base64Content,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update document");
          }

          const updatedDocument = await response.json();

          // Convert the content to base64 for storage
          const documentWithBase64 = {
            ...updatedDocument,
            content: base64Content,
          };

          set((state) => ({
            documents: state.documents.map((doc) =>
              doc._id?.toString() === id ? documentWithBase64 : doc
            ),
            currentDocument:
              state.currentDocument?._id?.toString() === id
                ? documentWithBase64
                : state.currentDocument,
          }));
        } catch (error) {
          console.error("Error updating document:", error);
          throw error;
        }
      },

      setCurrentDocument: (document) => {
        // Convert base64 content back to Buffer when setting current document
        if (document && typeof document.content === "string") {
          const arrayBuffer = base64ToArrayBuffer(document.content as string);
          const documentWithBuffer = {
            ...document,
            content: Buffer.from(arrayBuffer),
          };
          set({ currentDocument: documentWithBuffer });
        } else {
          set({ currentDocument: document });
        }
      },

      deleteDocument: async (id) => {
        try {
          const response = await fetch(`/api/documents?documentId=${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete document");
          }

          set((state) => ({
            documents: state.documents.filter(
              (doc) => doc._id?.toString() !== id
            ),
            currentDocument:
              state.currentDocument?._id?.toString() === id
                ? null
                : state.currentDocument,
          }));
        } catch (error) {
          console.error("Error removing document:", error);
          throw error;
        }
      },

      searchDocuments: async (query, filters = {}) => {
        set({ isLoading: true, error: null });
        try {
          const searchParams = new URLSearchParams({
            q: query,
            ...(filters.tags ? { tags: filters.tags.join(",") } : {}),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.category ? { category: filters.category } : {}),
          });

          const response = await fetch(`/api/documents/search?${searchParams}`);
          if (!response.ok) throw new Error("Search failed");

          const data = await response.json();
          set({
            documents: data.documents.map((doc: Document) => ({
              ...doc,
              content:
                typeof doc.content === "string"
                  ? doc.content
                  : arrayBufferToBase64(doc.content),
            })),
            searchQuery: query,
            searchFilters: filters,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Search failed",
            isLoading: false,
          });
        }
      },

      loadDocuments: async () => {
        try {
          const response = await fetch("/api/documents");
          if (!response.ok) {
            throw new Error("Failed to load documents");
          }
          const documents = await response.json();
          set({
            documents: documents.map((doc: Document) => ({
              ...doc,
              content:
                typeof doc.content === "string"
                  ? doc.content
                  : arrayBufferToBase64(doc.content),
            })),
          });
        } catch (error) {
          console.error("Error loading documents:", error);
          throw error;
        }
      },
    }),
    {
      name: "document-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documents: state.documents,
        searchFilters: state.searchFilters,
      }),
    }
  )
);
