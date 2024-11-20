export type DocumentType = 'pdf' | 'excel' | 'word' | 'text'

export interface Document {
  _id: string
  name: string
  type: DocumentType
  content: string
  originalUrl: string
  convertedUrl?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  size: number
  metadata?: {
    pageCount?: number
    author?: string
    createdDate?: Date
    lastModified?: Date
    [key: string]: any
  }
}

export interface DocumentUpdate {
  name?: string
  content?: string
  convertedUrl?: string
  updatedAt: Date
  metadata?: {
    [key: string]: any
  }
}
