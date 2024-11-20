import { Document } from '@/models/document';
import { createHash, randomBytes } from 'crypto';
import { sign, verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export interface ShareSettings {
  expiresAt?: Date;
  password?: string;
  permissions: {
    read: boolean;
    write: boolean;
    download: boolean;
  };
}

export class DocumentSharing {
  static async generateShareLink(document: Document, settings: ShareSettings): Promise<string> {
    const token = sign(
      {
        documentId: document._id,
        permissions: settings.permissions,
        expiresAt: settings.expiresAt?.toISOString(),
      },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    if (settings.password) {
      const salt = randomBytes(16).toString('hex');
      const hash = this.hashPassword(settings.password, salt);
      // Store the hash and salt in your database
    }

    return `${process.env.NEXT_PUBLIC_APP_URL}/shared/${token}`;
  }

  static async validateShareLink(token: string, password?: string): Promise<boolean> {
    try {
      const decoded = verify(token, SECRET_KEY) as any;
      
      if (decoded.expiresAt && new Date(decoded.expiresAt) < new Date()) {
        return false;
      }

      if (password) {
        // Verify password hash from database
        // Return false if password doesn't match
      }

      return true;
    } catch {
      return false;
    }
  }

  static async getSharePermissions(token: string): Promise<ShareSettings['permissions']> {
    try {
      const decoded = verify(token, SECRET_KEY) as any;
      return decoded.permissions;
    } catch {
      return { read: false, write: false, download: false };
    }
  }

  private static hashPassword(password: string, salt: string): string {
    return createHash('sha256')
      .update(password + salt)
      .digest('hex');
  }

  static async exportDocument(document: Document, format: string): Promise<Buffer> {
    // Implement document export logic here
    // Convert document to requested format (PDF, DOCX, XLSX)
    return Buffer.from('');
  }

  static async createAuditLog(documentId: string, userId: string, action: string): Promise<void> {
    // Implement audit logging logic here
    console.log(`Audit: User ${userId} performed ${action} on document ${documentId}`);
  }
}
