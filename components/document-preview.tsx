"use client"

import { useState, useEffect } from "react"
import { Document as PDFDocument, Page, pdfjs } from "react-pdf"
import { Loader2 } from "lucide-react"
import { Document } from "@/types/document"

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentPreviewProps {
  document: Document
  width?: number
}

export function DocumentPreview({ document, width = 200 }: DocumentPreviewProps) {
  const [thumbnail, setThumbnail] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateThumbnail()
  }, [document])

  const generateThumbnail = async () => {
    setLoading(true)
    try {
      if (document.type === "pdf") {
        // PDF preview will be handled by react-pdf
        setThumbnail("")
      } else if (document.type === "excel") {
        // For Excel files, we'll show a generic Excel icon
        setThumbnail("/icons/excel.png")
      } else if (document.type === "word") {
        // For Word files, we'll show a generic Word icon
        setThumbnail("/icons/word.png")
      } else {
        // For other files, show a generic document icon
        setThumbnail("/icons/document.png")
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error)
      setThumbnail("/icons/error.png")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (document.type === "pdf") {
    return (
      <div className="relative">
        <PDFDocument file={document.originalUrl} loading="Loading PDF...">
          <Page
            pageNumber={1}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </PDFDocument>
      </div>
    )
  }

  return (
    <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
      {thumbnail && (
        <img
          src={thumbnail}
          alt={`${document.name} preview`}
          className="w-full h-full object-contain p-4"
        />
      )}
    </div>
  )
}
