import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Document } from '@/models/document';
import { DocumentSharing } from '@/lib/documentSharing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

export default function SharedDocumentPage() {
  const { token } = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<{
    read: boolean;
    write: boolean;
    download: boolean;
  }>({
    read: false,
    write: false,
    download: false,
  });

  useEffect(() => {
    const validateShare = async () => {
      try {
        const isValid = await DocumentSharing.validateShareLink(token as string);
        if (!isValid) {
          setError('This share link is invalid or has expired');
          return;
        }

        const sharePermissions = await DocumentSharing.getSharePermissions(token as string);
        setPermissions(sharePermissions);

        // Fetch document details from API
        const response = await fetch(`/api/documents/shared/${token}`);
        const data = await response.json();

        if (data.passwordProtected) {
          setIsPasswordProtected(true);
        } else {
          setDocument(data.document);
        }
      } catch (err) {
        setError('Failed to load shared document');
      } finally {
        setIsValidating(false);
      }
    };

    validateShare();
  }, [token]);

  const handlePasswordSubmit = async () => {
    try {
      const isValid = await DocumentSharing.validateShareLink(token as string, password);
      if (!isValid) {
        setError('Invalid password');
        return;
      }

      const response = await fetch(`/api/documents/shared/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      setDocument(data.document);
      setIsPasswordProtected(false);
    } catch (err) {
      setError('Failed to validate password');
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <Button variant="outline" onClick={() => window.close()}>
          Close
        </Button>
      </div>
    );
  }

  if (isPasswordProtected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-semibold">Password Protected Document</h2>
            <p className="text-sm text-gray-500">
              Enter the password to access this document
            </p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handlePasswordSubmit}
              disabled={!password}
            >
              Access Document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Document not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{document.name}</h1>
          <div className="flex gap-2 mt-2">
            {permissions.read && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Can Read
              </span>
            )}
            {permissions.write && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Can Edit
              </span>
            )}
            {permissions.download && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Can Download
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Document viewer component based on document type */}
          {/* Add your document viewer component here */}
          
          <div className="flex justify-end gap-2">
            {permissions.download && (
              <Button variant="outline" onClick={() => {}}>
                Download
              </Button>
            )}
            {permissions.write && (
              <Button onClick={() => {}}>Edit Document</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
