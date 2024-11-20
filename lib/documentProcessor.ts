import { Document } from '@/models/document';
import { createWorker } from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';
import { WordExtractor } from 'word-extractor';
import * as XLSX from 'xlsx';

export class DocumentProcessor {
  static async extractText(document: Document): Promise<string> {
    switch (document.type) {
      case 'pdf':
        return await this.extractPDFText(document.content);
      case 'word':
        return await this.extractWordText(document.content);
      case 'excel':
        return await this.extractExcelText(document.content);
      default:
        throw new Error('Unsupported document type');
    }
  }

  private static async extractPDFText(buffer: Buffer): Promise<string> {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }

    return text;
  }

  private static async extractWordText(buffer: Buffer): Promise<string> {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    return doc.getBody();
  }

  private static async extractExcelText(buffer: Buffer): Promise<string> {
    const workbook = XLSX.read(buffer);
    let text = '';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      text += XLSX.utils.sheet_to_txt(sheet) + '\n';
    });

    return text;
  }

  static async performOCR(imageBuffer: Buffer): Promise<string> {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text;
  }

  static getDocumentStats(text: string) {
    return {
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      lineCount: text.split('\n').length,
      readingTime: Math.ceil(text.split(/\s+/).length / 200), // Average reading speed of 200 words per minute
    };
  }
}
