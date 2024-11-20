import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { DocumentSharing } from "@/lib/documentSharing";
import clientPromise from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const isValid = await DocumentSharing.validateShareLink(token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired share link" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const shareCollection = db.collection("documentShares");
    const share = await shareCollection.findOne({ token });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const documentCollection = db.collection("documents");
    const document = await documentCollection.findOne({
      _id: new ObjectId(share.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // If password protected, don't return document content yet
    if (share.password) {
      return NextResponse.json({
        passwordProtected: true,
        documentName: document.name,
      });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error in GET /api/documents/shared/[token]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { password } = await request.json();

    const isValid = await DocumentSharing.validateShareLink(token, password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const shareCollection = db.collection("documentShares");
    const share = await shareCollection.findOne({ token });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const documentCollection = db.collection("documents");
    const document = await documentCollection.findOne({
      _id: new ObjectId(share.documentId),
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Log access
    await DocumentSharing.createAuditLog(
      share.documentId,
      "anonymous",
      "accessed_shared_document"
    );

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error in POST /api/documents/shared/[token]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { changes } = await request.json();

    const permissions = await DocumentSharing.getSharePermissions(token);
    if (!permissions.write) {
      return NextResponse.json(
        { error: "Write permission required" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const shareCollection = db.collection("documentShares");
    const share = await shareCollection.findOne({ token });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const documentCollection = db.collection("documents");
    const result = await documentCollection.updateOne(
      { _id: new ObjectId(share.documentId) },
      { $set: changes }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Document not found or no changes made" },
        { status: 404 }
      );
    }

    // Log modification
    await DocumentSharing.createAuditLog(
      share.documentId,
      "anonymous",
      "modified_shared_document"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/documents/shared/[token]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
