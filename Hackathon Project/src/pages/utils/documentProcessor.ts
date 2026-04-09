// ============================================================
// LegasistAI - Client-side Document Processing
// Handles text extraction from PDF, DOCX, and TXT files
// before upload and AI analysis
// ============================================================

// ---- PDF Text Extraction (PDF.js) --------------------------

/**
 * Extracts text content from a PDF file using PDF.js.
 * PDF.js runs entirely in the browser with no server required.
 */
export async function extractTextFromPDF(file: File): Promise<ExtractionResult> {
  // Dynamically import PDF.js to avoid bundle bloat
  const pdfjsLib = await import('pdfjs-dist');

  // IMPORTANT: Set worker src to CDN for PDF.js web worker
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const numPages = pdfDoc.numPages;

  const pageTexts: string[] = [];
  let totalWordCount = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Join text items, preserving approximate line breaks
    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) return item.str;
        return '';
      })
      .join(' ')
      .replace(/\s{3,}/g, '\n\n')  // Multiple spaces → paragraph breaks
      .trim();

    pageTexts.push(pageText);
    totalWordCount += pageText.split(/\s+/).filter(Boolean).length;
  }

  const fullText = pageTexts.join('\n\n--- Page Break ---\n\n');

  return {
    text: fullText,
    pageCount: numPages,
    wordCount: totalWordCount,
    fileType: 'pdf',
  };
}

// ---- DOCX Text Extraction (mammoth.js) ---------------------

/**
 * Extracts text from a DOCX file using mammoth.js.
 */
export async function extractTextFromDOCX(file: File): Promise<ExtractionResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.extractRawText({ arrayBuffer });

  if (result.messages?.some((m) => m.type === 'error')) {
    console.warn('DOCX extraction warnings:', result.messages);
  }

  const text = result.value?.trim() ?? '';
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    text,
    pageCount: null,    // DOCX doesn't have a page concept client-side
    wordCount,
    fileType: 'docx',
  };
}

// ---- TXT Extraction ----------------------------------------

/**
 * Reads a plain text file as UTF-8.
 */
export async function extractTextFromTXT(file: File): Promise<ExtractionResult> {
  const text = await file.text();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    text: text.trim(),
    pageCount: null,
    wordCount,
    fileType: 'txt',
  };
}

// ---- Universal Dispatcher ----------------------------------

/**
 * Extracts text from any supported file type.
 * Dispatches to the correct extractor based on file MIME type.
 */
export async function extractDocumentText(
  file: File,
  onProgress?: (stage: ExtractionStage, percent: number) => void
): Promise<ExtractionResult> {
  onProgress?.('validating', 0);
  validateFile(file);

  onProgress?.('extracting', 10);

  let result: ExtractionResult;

  switch (file.type) {
    case 'application/pdf':
      result = await extractTextFromPDF(file);
      break;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      result = await extractTextFromDOCX(file);
      break;

    case 'text/plain':
      result = await extractTextFromTXT(file);
      break;

    default:
      throw new DocumentProcessingError(
        `Unsupported file type: ${file.type}`,
        'UNSUPPORTED_FILE_TYPE'
      );
  }

  onProgress?.('cleaning', 80);
  result.text = cleanExtractedText(result.text);

  onProgress?.('complete', 100);
  return result;
}

// ---- Text Cleaning -----------------------------------------

/**
 * Normalizes extracted text for AI processing.
 * Removes artifacts from PDF extraction, normalizes whitespace.
 */
export function cleanExtractedText(raw: string): string {
  return raw
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove non-printable characters (except tabs and newlines)
    .replace(/[^\x09\x0A\x20-\x7E\u00A0-\uFFFF]/g, '')
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim trailing whitespace on each line
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    // Remove very short lines that are likely extraction artifacts
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;                          // Keep blank lines
      if (/^\d+$/.test(trimmed) && trimmed.length <= 4) return false;  // Page numbers
      if (trimmed.length === 1) return false;             // Single chars
      return true;
    })
    .join('\n')
    .trim();
}

// ---- File Validation ---------------------------------------

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;  // 50MB
const MIN_FILE_SIZE_BYTES = 100;               // 100 bytes

export function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new DocumentProcessingError(
      `Unsupported file type "${file.type}". Please upload a PDF, DOCX, or TXT file.`,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new DocumentProcessingError(
      `File is too large (${sizeMB}MB). Maximum allowed size is 50MB.`,
      'FILE_TOO_LARGE'
    );
  }

  if (file.size < MIN_FILE_SIZE_BYTES) {
    throw new DocumentProcessingError('File appears to be empty.', 'FILE_EMPTY');
  }
}

// ---- Document Preview Utility ------------------------------

/**
 * Returns the first N characters of document text for preview.
 */
export function generateTextPreview(text: string, chars = 500): string {
  const trimmed = text.trim();
  if (trimmed.length <= chars) return trimmed;
  return trimmed.slice(0, chars).replace(/\s+\S*$/, '') + '…';
}

// ---- Types & Errors ----------------------------------------

export type ExtractionStage = 'validating' | 'extracting' | 'cleaning' | 'complete';

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
  wordCount: number;
  fileType: 'pdf' | 'docx' | 'txt';
}

export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'DocumentProcessingError';
  }
}
