export type FileFormat = 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'WEBP';

/** Canonical conversion matrix */
export const CONVERSION_MATRIX: Record<FileFormat, FileFormat[]> = {
  PDF:  ['JPG', 'PNG'],
  DOCX: ['PDF'],
  XLSX: ['PDF'],
  JPG:  ['PDF', 'PNG', 'WEBP'],
  PNG:  ['PDF', 'JPG', 'WEBP'],
  WEBP: ['JPG', 'PNG', 'PDF'],
};

/** Default output format for each input format */
export const DEFAULT_OUTPUT: Record<FileFormat, FileFormat> = {
  PDF:  'JPG',
  DOCX: 'PDF',
  XLSX: 'PDF',
  JPG:  'PDF',
  PNG:  'PDF',
  WEBP: 'PDF',
};

/** MIME types for each format */
export const MIME_TYPES: Record<FileFormat, string> = {
  PDF:  'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  JPG:  'image/jpeg',
  PNG:  'image/png',
  WEBP: 'image/webp',
};

/** File extensions → format */
export const EXT_TO_FORMAT: Record<string, FileFormat> = {
  pdf:  'PDF',
  docx: 'DOCX',
  xlsx: 'XLSX',
  jpg:  'JPG',
  jpeg: 'JPG',
  png:  'PNG',
  webp: 'WEBP',
};

export function detectFormat(filename: string): FileFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_FORMAT[ext] ?? null;
}

export function canSwap(from: FileFormat, to: FileFormat): boolean {
  return CONVERSION_MATRIX[to]?.includes(from) ?? false;
}

export function getOutputFilename(originalName: string, outputFormat: FileFormat): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  const ext = outputFormat.toLowerCase();
  return `${base}.${ext}`;
}
