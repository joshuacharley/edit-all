import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Grid, List, Image, FileText, File } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Document } from '@/models/document';
import { Button } from '@/components/ui/button';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from '@/components/ui/use-toast';

interface DocumentGridProps {
  documents: Document[];
  onOrderChange?: (documents: Document[]) => void;
}

export function DocumentGrid({ documents, onOrderChange }: DocumentGridProps) {
  const [isGridView, setIsGridView] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const { theme } = useTheme();
  const { toast } = useToast();

  // Keyboard shortcuts
  useHotkeys('ctrl+g', () => setIsGridView(true), { preventDefault: true });
  useHotkeys('ctrl+l', () => setIsGridView(false), { preventDefault: true });

  useEffect(() => {
    // Generate thumbnails for documents
    documents.forEach(async (doc) => {
      try {
        const thumbnail = await generateThumbnail(doc);
        setThumbnails(prev => ({ ...prev, [doc._id!.toString()]: thumbnail }));
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    });
  }, [documents]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(documents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onOrderChange?.(items);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6" />;
      case 'image':
        return <Image className="h-6 w-6" />;
      default:
        return <File className="h-6 w-6" />;
    }
  };

  async function generateThumbnail(doc: Document): Promise<string> {
    // Implement thumbnail generation based on document type
    // For now, return a placeholder
    return '/placeholder-thumbnail.png';
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGridView(true)}
            className={isGridView ? 'bg-primary text-primary-foreground' : ''}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsGridView(false)}
            className={!isGridView ? 'bg-primary text-primary-foreground' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {isGridView ? 'Ctrl+G for Grid View' : 'Ctrl+L for List View'}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="documents" direction={isGridView ? 'horizontal' : 'vertical'}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`${
                isGridView
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-2'
              }`}
            >
              {documents.map((doc, index) => (
                <Draggable
                  key={doc._id!.toString()}
                  draggableId={doc._id!.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        ${isGridView
                          ? 'p-4 rounded-lg border bg-card'
                          : 'p-2 rounded-md border bg-card'}
                        ${snapshot.isDragging ? 'shadow-lg' : ''}
                        transition-shadow hover:shadow-md
                      `}
                    >
                      {isGridView ? (
                        <div className="space-y-2">
                          <div className="aspect-square rounded-md overflow-hidden bg-muted">
                            {thumbnails[doc._id!.toString()] ? (
                              <img
                                src={thumbnails[doc._id!.toString()]}
                                alt={doc.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getDocumentIcon(doc.type)}
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-medium truncate">
                            {doc.name}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(doc.type)}
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Last modified: {new Date(doc.lastModified).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
