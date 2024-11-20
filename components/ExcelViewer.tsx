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
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet);
    
    if (jsonData.length > 0) {
      setHeaders(Object.keys(jsonData[0]));
      setRows(jsonData);
    }
  }, [data]);

  const handleCellEdit = (value: string, rowIndex: number, column: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [column]: value };
    setRows(newRows);
    setEditingCell(null);

    // Convert back to Excel format and update document
    const ws = XLSX.utils.json_to_sheet(newRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const newBuffer = XLSX.write(wb, { type: 'array' }) as ArrayBuffer;
    updateDocument(documentId, newBuffer);
  };

  const handleCellClick = (rowIndex: number, column: string) => {
    setEditingCell({ row: rowIndex, col: column });
  };

  if (rows.length === 0) {
    return <div>No data</div>;
  }

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
                  {editingCell?.row === rowIndex && editingCell?.col === header ? (
                    <Input
                      autoFocus
                      defaultValue={String(row[header] || '')}
                      onBlur={(e) => handleCellEdit(e.target.value, rowIndex, header)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCellEdit(e.currentTarget.value, rowIndex, header);
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => handleCellClick(rowIndex, header)}
                    >
                      {String(row[header] || '')}
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
