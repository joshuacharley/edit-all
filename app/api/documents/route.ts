import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Document } from '@/models/document';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
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

    const document = await Document.create({
      name: file.name,
      type: documentType,
      content: buffer,
      lastModified: new Date(),
      history: [{ content: buffer }],
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { documentId, content } = await req.json();

    const document = await Document.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Add current content to history
    document.history.push({ content: Buffer.from(content) });
    document.currentHistoryIndex = document.history.length - 1;
    document.content = Buffer.from(content);
    document.lastModified = new Date();

    await document.save();
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (documentId) {
      const document = await Document.findById(documentId);
      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json(document);
    }

    const documents = await Document.find()
      .sort({ lastModified: -1 })
      .select('-content -history');
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const document = await Document.findByIdAndDelete(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
