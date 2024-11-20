"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Button } from "./ui/button"
import { validateFile, ALLOWED_FILE_TYPES } from "@/lib/file-validation"
import { Alert, AlertDescription } from "./ui/alert"

interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
}

export function FileUploadDropzone({
  onFilesSelected,
  maxFiles = 10,
}: FileUploadDropzoneProps) {
  const [previews, setPreviews] = useState<Array<{ file: File; preview: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate each file
      const validFiles: File[] = []
      const errors: string[] = []

      acceptedFiles.forEach((file) => {
        const validation = validateFile(file)
        if (validation.isValid) {
          validFiles.push(file)
        } else {
          errors.push(`${file.name}: ${validation.error}`)
        }
      })

      if (errors.length > 0) {
        setError(errors.join('\n'))
        return
      }

      // Create previews for valid files
      const newPreviews = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

      setPreviews((prev) => [...prev, ...newPreviews])
      onFilesSelected(validFiles)
      setError(null)
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: Object.entries(ALLOWED_FILE_TYPES).reduce((acc, [_, type]) => {
      type.mimeTypes.forEach((mimeType) => {
        acc[mimeType] = type.extensions
      })
      return acc
    }, {} as Record<string, string[]>),
  })

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index].preview)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  return (
    <div className="w-full space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? "Drop the files here..."
            : "Drag 'n' drop files here, or click to select files"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: PDF (max 10MB), DOC/DOCX (max 5MB), XLS/XLSX (max 5MB), TXT (max 1MB)
        </p>
      </div>

      {previews.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={preview.preview}
              className="relative group border rounded-lg p-2"
            >
              <div className="aspect-square relative">
                {preview.file.type.startsWith("image/") ? (
                  <Image
                    src={preview.preview}
                    alt={preview.file.name}
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                    <File className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="mt-2 text-xs truncate">{preview.file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
