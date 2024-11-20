"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Document } from "@/types/document"
import { DocumentCard } from "./document-card"

interface DocumentGridProps {
  documents: Document[]
  onReorder?: (documents: Document[]) => void
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
}

export function DocumentGrid({
  documents,
  onReorder,
  onDelete,
  onDownload,
}: DocumentGridProps) {
  const [items, setItems] = useState(documents)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    setItems(newItems)
    onReorder?.(newItems)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="documents" direction="horizontal">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {items.map((document, index) => (
              <Draggable
                key={document._id}
                draggableId={document._id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-shadow ${
                      snapshot.isDragging ? "shadow-lg" : ""
                    }`}
                  >
                    <DocumentCard
                      document={document}
                      onDelete={onDelete}
                      onDownload={onDownload}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
