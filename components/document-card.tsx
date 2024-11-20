"use client"

import { FileText, FileSpreadsheet, File, MoreVertical, Download, Trash } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Document } from "@/types/document"

interface DocumentCardProps {
  document: Document
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
}

export function DocumentCard({ document, onDelete, onDownload }: DocumentCardProps) {
  const getIcon = () => {
    switch (document.type) {
      case "excel":
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />
      case "word":
        return <FileText className="h-8 w-8 text-blue-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{document.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDownload?.(document._id)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete?.(document._id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          {getIcon()}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(document.updatedAt, { addSuffix: true })}
            </p>
            <p className="text-sm text-muted-foreground">
              {(document.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline" asChild>
          <a href={`/edit/${document._id}`}>Open Document</a>
        </Button>
      </CardFooter>
    </Card>
  )
}
