import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { Document, COLLECTION_NAME } from '@/models/document';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const tags = searchParams.get('tags')?.split(',');
    const category = searchParams.get('category');

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Document>(COLLECTION_NAME);

    // Build search query
    const searchQuery: any = {};
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { searchText: { $regex: query, $options: 'i' } },
      ];
    }

    if (type) {
      searchQuery.type = type;
    }

    if (tags?.length) {
      searchQuery.tags = { $in: tags };
    }

    if (category) {
      searchQuery.category = category;
    }

    // Execute search with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      collection
        .find(searchQuery, { projection: { content: 0, history: 0 } })
        .sort({ lastModified: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(searchQuery),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json({ error: 'Failed to search documents' }, { status: 500 });
  }
}
