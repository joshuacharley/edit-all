"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"

export function Navbar() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="font-bold">DocEditor</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/documents">My Documents</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/templates">Templates</Link>
          </Button>
          <ThemeToggle />
          <Button>
            <Link href="/upload">Upload</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
