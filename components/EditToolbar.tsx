import { Undo2, Redo2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/store/documentStore';

interface EditToolbarProps {
  documentId: string;
  onSave?: () => void;
}

export function EditToolbar({ documentId, onSave }: EditToolbarProps) {
  const { undo, redo } = useDocumentStore();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => undo(documentId)}
        title="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => redo(documentId)}
        title="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      {onSave && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          title="Save"
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
