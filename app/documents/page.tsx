"use client"

import { useState, useCallback } from "react"
import { FileUploadDropzone } from "@/components/file-upload-dropzone"
import { DocumentGrid } from "@/components/document-grid"
import { DocumentSearch } from "@/components/document-search"
import { Document } from "@/types/document"

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const handleFilesSelected = async (files: File[]) => {
    // Here you would typically upload the files to your server
    // and get back the document objects
    const newDocuments: Document[] = files.map((file) => ({
      _id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.name.split(".").pop() as any,
      content: "",
      originalUrl: URL.createObjectURL(file),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user123", // Replace with actual user ID
      size: file.size,
    }))

    setDocuments((prev) => [...prev, ...newDocuments])
  }

  const handleReorder = (reorderedDocuments: Document[]) => {
    setDocuments(reorderedDocuments)
    // Here you would typically update the order in your database
  }

  const handleDelete = async (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc._id !== id))
    // Here you would typically delete the document from your database
  }

  const handleDownload = async (id: string) => {
    const document = documents.find((doc) => doc._id === id)
    if (document) {
      // Here you would typically generate a download URL and trigger the download
      window.open(document.originalUrl, "_blank")
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((filters: string[]) => {
    setActiveFilters(filters)
  }, [])

  // Filter and search documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesFilter =
      activeFilters.length === 0 || activeFilters.includes(doc.type)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Documents</h1>
        <FileUploadDropzone onFilesSelected={handleFilesSelected} />
      </div>

      <DocumentSearch
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {filteredDocuments.length > 0 ? (
        <DocumentGrid
          documents={filteredDocuments}
          onReorder={handleReorder}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      ) : (
        <div className="text-center text-gray-500 py-12">
          {documents.length === 0 ? (
            <p>No documents yet. Upload some files to get started!</p>
          ) : (
            <p>No documents match your search criteria.</p>
          )}
        </div>
      )}
    </div>
  )
}
