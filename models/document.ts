import { Schema, model, models, Document as MongoDocument } from 'mongoose';

export interface DocumentHistory {
  content: Buffer;
  timestamp: Date;
}

export interface Document extends MongoDocument {
  name: string;
  type: 'pdf' | 'excel' | 'word';
  content: Buffer;
  lastModified: Date;
  history: DocumentHistory[];
  currentHistoryIndex: number;
}

const documentSchema = new Schema<Document>({
  name: {
    type: String,
    required: [true, 'Document name is required'],
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: ['pdf', 'excel', 'word'],
  },
  content: {
    type: Buffer,
    required: [true, 'Document content is required'],
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  history: [{
    content: {
      type: Buffer,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  currentHistoryIndex: {
    type: Number,
    default: 0,
  },
});

// Create indexes
documentSchema.index({ type: 1 });
documentSchema.index({ lastModified: -1 });

export const Document = models.Document || model<Document>('Document', documentSchema);
