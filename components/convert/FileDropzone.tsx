'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { detectFormat, type FileFormat } from '@/lib/formats';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface FileDropzoneProps {
  onFile: (file: File, detectedFormat: FileFormat | null) => void;
  accept?: FileFormat[];
}

export default function FileDropzone({ onFile, accept }: FileDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) {
        onFile(accepted[0], detectFormat(accepted[0].name));
      }
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const sizeError = fileRejections.some((r) =>
    r.errors.some((e) => e.code === 'file-too-large')
  );

  return (
    <div>
      <div
        {...getRootProps()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          isDragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-gray-300 bg-white hover:border-brand-300 hover:bg-gray-50',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Relâchez le fichier ici' : 'Glissez votre fichier ici'}
        </p>
        <p className="mt-1 text-xs text-gray-400">ou cliquez pour parcourir — 10 Mo max</p>
      </div>
      {sizeError && (
        <p className="mt-2 text-xs text-red-600">Fichier trop volumineux (max 10 Mo).</p>
      )}
    </div>
  );
}
