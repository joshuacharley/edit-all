import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { Document, COLLECTION_NAME } from '@/models/document';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Document>(COLLECTION_NAME);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.name.toLowerCase().split('.').pop();
    let documentType: 'pdf' | 'excel' | 'word';

    if (type === 'pdf') documentType = 'pdf';
    else if (type === 'xlsx' || type === 'xls') documentType = 'excel';
    else if (['docx', 'doc', 'dotx', 'dot', 'docm', 'dotm', 'odt'].includes(type!)) documentType = 'word';
    else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const document = await collection.insertOne({
      name: file.name,
      type: documentType,
      content: buffer,
      lastModified: new Date(),
      history: [{ content: buffer, timestamp: new Date() }],
      currentHistoryIndex: 0
    });

    return NextResponse.json({ success: true, documentId: document.insertedId });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Document>(COLLECTION_NAME);

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (documentId) {
      const document = await collection.findOne({ _id: new ObjectId(documentId) });
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json(document);
    }

    // Return all documents with content for the list view
    const documents = await collection.find({}).toArray();
    return NextResponse.json(documents.map(doc => ({
      ...doc,
      content: doc.content.toString('base64'), // Convert Buffer to base64 for transmission
    })));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Document>(COLLECTION_NAME);
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    
    if (!file || !documentId) {
      return NextResponse.json({ error: 'File and document ID are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const document = await collection.findOne({ _id: new ObjectId(documentId) });
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(documentId) },
      { 
        $set: { 
          content: buffer,
          lastModified: new Date()
        },
        $push: { 
          history: { 
            content: buffer,
            timestamp: new Date()
          } 
        }
      }
    );

    return NextResponse.json({ success: true, updated: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Document>(COLLECTION_NAME);
    
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(documentId) });
    return NextResponse.json({ success: true, deleted: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
