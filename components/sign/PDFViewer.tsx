'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Button from '@/components/ui/Button';

// Use local worker bundled via webpack alias
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  overlay?: React.ReactNode;
}

export default function PDFViewer({ fileUrl, currentPage, onPageChange, overlay }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex h-64 w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
              Chargement du PDF…
            </div>
          }
        >
          <Page pageNumber={currentPage} width={560} />
        </Document>
        {overlay && (
          <div className="absolute inset-0 z-10">{overlay}</div>
        )}
      </div>

      {/* Pagination */}
      {numPages > 1 && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            ←
          </Button>
          <span>Page {currentPage} / {numPages}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
          >
            →
          </Button>
        </div>
      )}
    </div>
  );
}
