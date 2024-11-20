"use client";

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useDocumentStore } from '@/store/documentStore';

interface ExcelViewerProps {
  data: ArrayBuffer;
  documentId: string;
}

type ExcelRow = Record<string, string | number>;

export function ExcelViewer({ data, documentId }: ExcelViewerProps) {
  const { updateDocument } = useDocumentStore();
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{row: number; col: string} | null>(null);

  useEffect(() => {
    if (!data) return;

    try {
      // Convert ArrayBuffer to Uint8Array for XLSX
      const uint8Array = new Uint8Array(data);
      const workbook = XLSX.read(uint8Array, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        console.error('No sheets found in the workbook');
        return;
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);
      
      if (jsonData.length > 0) {
        setHeaders(Object.keys(jsonData[0]));
        setRows(jsonData);
      } else {
        console.warn('No data found in the Excel sheet');
        setHeaders([]);
        setRows([]);
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      setHeaders([]);
      setRows([]);
    }
  }, [data]);

  const handleCellEdit = (value: string, rowIndex: number, column: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [column]: value };
    setRows(newRows);
    setEditingCell(null);

    try {
      // Convert back to Excel format and update document
      const ws = XLSX.utils.json_to_sheet(newRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const newBuffer = XLSX.write(wb, { type: 'array' }) as ArrayBuffer;
      updateDocument(documentId, newBuffer);
    } catch (error) {
      console.error('Error updating Excel file:', error);
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map((header) => (
                <TableCell key={`${rowIndex}-${header}`}>
                  {editingCell?.row === rowIndex && editingCell.col === header ? (
                    <Input
                      value={row[header]?.toString() || ''}
                      onChange={(e) => handleCellEdit(e.target.value, rowIndex, header)}
                      onBlur={() => setEditingCell(null)}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="min-h-[2rem] cursor-pointer hover:bg-gray-100 p-2 rounded"
                      onClick={() => setEditingCell({ row: rowIndex, col: header })}
                    >
                      {row[header]?.toString() || ''}
                    </div>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
