import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Document } from '@/models/document';
import { DocumentSharing, ShareSettings } from '@/lib/documentSharing';
import { DocumentProcessor } from '@/lib/documentProcessor';
import { Share2, Download, FileText, Lock, Calendar } from 'lucide-react';

interface DocumentActionsProps {
  document: Document;
}

export function DocumentActions({ document }: DocumentActionsProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    permissions: { read: true, write: false, download: false },
  });
  const [shareLink, setShareLink] = useState('');
  const [stats, setStats] = useState<any>(null);

  const handleShare = async () => {
    const link = await DocumentSharing.generateShareLink(document, shareSettings);
    setShareLink(link);
  };

  const handleExport = async (format: string) => {
    const buffer = await DocumentSharing.exportDocument(document, format);
    // Implement download logic
  };

  const handleViewStats = async () => {
    const text = await DocumentProcessor.extractText(document);
    const documentStats = DocumentProcessor.getDocumentStats(text);
    setStats(documentStats);
    setStatsDialogOpen(true);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('docx')}>
            Export as Word
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('xlsx')}>
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={handleViewStats}>
        <FileText className="h-4 w-4 mr-2" />
        Stats
      </Button>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="read">Allow reading</Label>
                  <Switch
                    id="read"
                    checked={shareSettings.permissions.read}
                    onCheckedChange={(checked) =>
                      setShareSettings({
                        ...shareSettings,
                        permissions: { ...shareSettings.permissions, read: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="write">Allow editing</Label>
                  <Switch
                    id="write"
                    checked={shareSettings.permissions.write}
                    onCheckedChange={(checked) =>
                      setShareSettings({
                        ...shareSettings,
                        permissions: { ...shareSettings.permissions, write: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="download">Allow downloading</Label>
                  <Switch
                    id="download"
                    checked={shareSettings.permissions.download}
                    onCheckedChange={(checked) =>
                      setShareSettings({
                        ...shareSettings,
                        permissions: { ...shareSettings.permissions, download: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password Protection</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Optional password"
                  onChange={(e) =>
                    setShareSettings({ ...shareSettings, password: e.target.value })
                  }
                />
                <Button variant="outline" size="icon">
                  <Lock className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  onChange={(e) =>
                    setShareSettings({
                      ...shareSettings,
                      expiresAt: new Date(e.target.value),
                    })
                  }
                />
                <Button variant="outline" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {shareLink && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly />
                  <Button
                    onClick={() => navigator.clipboard.writeText(shareLink)}
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={handleShare} className="w-full">
              Generate Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Statistics</DialogTitle>
          </DialogHeader>
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Word Count</Label>
                  <div className="text-2xl font-bold">{stats.wordCount}</div>
                </div>
                <div>
                  <Label>Character Count</Label>
                  <div className="text-2xl font-bold">{stats.characterCount}</div>
                </div>
                <div>
                  <Label>Line Count</Label>
                  <div className="text-2xl font-bold">{stats.lineCount}</div>
                </div>
                <div>
                  <Label>Reading Time</Label>
                  <div className="text-2xl font-bold">{stats.readingTime} min</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
