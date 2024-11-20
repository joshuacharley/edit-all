import { ObjectId } from 'mongodb';

export interface DocumentHistory {
  content: Buffer;
  timestamp: Date;
  user?: string;
}

export interface Document {
  _id?: ObjectId;
  name: string;
  type: 'pdf' | 'excel' | 'word';
  content: Buffer;
  lastModified: Date;
  history: DocumentHistory[];
  currentHistoryIndex: number;
  tags?: string[];
  category?: string;
  searchText?: string;
  collaborators?: string[];
  isFavorite?: boolean;
  lastViewed?: Date;
}

export const COLLECTION_NAME = 'documents';

// Create indexes
// documentSchema.index({ type: 1 });
// documentSchema.index({ lastModified: -1 });

// Removed the Mongoose model and schema definitions
