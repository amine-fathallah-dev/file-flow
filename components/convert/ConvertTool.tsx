'use client';

import { useState } from 'react';
import {
  CONVERSION_MATRIX,
  DEFAULT_OUTPUT,
  type FileFormat,
  getOutputFilename,
  detectFormat,
} from '@/lib/formats';
import FormatDropdown from './FormatDropdown';
import SwapButton from './SwapButton';
import FileDropzone from './FileDropzone';
import ConversionProgress from './ConversionProgress';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';

const GOTENBERG_FORMATS: FileFormat[] = ['DOCX', 'XLSX', 'PDF'];

export default function ConvertTool() {
  const [from, setFrom] = useState<FileFormat>('PDF');
  const [to, setTo] = useState<FileFormat>(DEFAULT_OUTPUT['PDF']);
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const allFormats = Object.keys(CONVERSION_MATRIX) as FileFormat[];
  const toOptions = CONVERSION_MATRIX[from];

  function handleFromChange(newFrom: FileFormat) {
    setFrom(newFrom);
    setTo(DEFAULT_OUTPUT[newFrom]);
    setFile(null);
    setDone(false);
    setError('');
  }

  function handleToChange(newTo: FileFormat) {
    setTo(newTo);
    setDone(false);
    setError('');
  }

  function handleSwap() {
    const prev = from;
    setFrom(to);
    setTo(prev);
    setFile(null);
    setDone(false);
    setError('');
  }

  function handleFile(f: File, detected: FileFormat | null) {
    setFile(f);
    setDone(false);
    setError('');
    if (detected && detected !== from) {
      setFrom(detected);
      setTo(DEFAULT_OUTPUT[detected]);
    }
  }

  async function handleConvert() {
    if (!file) return;
    setConverting(true);
    setError('');
    setDone(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('from', from);
      formData.append('to', to);

      const res = await fetch('/api/convert', { method: 'POST', body: formData });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(msg || `Erreur ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getOutputFilename(file.name, to);
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la conversion.');
    } finally {
      setConverting(false);
    }
  }

  function reset() {
    setFile(null);
    setDone(false);
    setError('');
  }

  const usesGotenberg = GOTENBERG_FORMATS.includes(from) || GOTENBERG_FORMATS.includes(to);

  return (
    <Card className="max-w-2xl">
      <CardBody className="space-y-6">
        {/* Format selectors */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <FormatDropdown
              label="FROM"
              value={from}
              options={allFormats}
              onChange={handleFromChange}
              disabled={converting}
            />
          </div>
          <div className="mb-1 flex-shrink-0">
            <SwapButton from={from} to={to} onSwap={handleSwap} />
          </div>
          <div className="flex-1">
            <FormatDropdown
              label="TO"
              value={to}
              options={toOptions}
              onChange={handleToChange}
              disabled={converting}
            />
          </div>
        </div>

        {/* Dropzone */}
        <FileDropzone onFile={handleFile} />

        {file && !done && (
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
            <span className="truncate font-medium text-gray-700">{file.name}</span>
            <span className="ml-3 flex-shrink-0 text-xs text-gray-400">
              {(file.size / 1024 / 1024).toFixed(2)} Mo
            </span>
          </div>
        )}

        {/* Progress */}
        {converting && <ConversionProgress isGotenberg={usesGotenberg} />}

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {/* Success */}
        {done && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Conversion réussie ! Le téléchargement a démarré automatiquement.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!done ? (
            <Button
              onClick={handleConvert}
              loading={converting}
              disabled={!file || converting}
              className="flex-1"
            >
              Convertir
            </Button>
          ) : (
            <Button variant="secondary" onClick={reset} className="flex-1">
              Nouvelle conversion
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
