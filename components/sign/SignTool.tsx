'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import PDFViewer from './PDFViewer';
import SignatureCanvas from './SignatureCanvas';
import SignatureDragger from './SignatureDragger';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';

type Step = 1 | 2 | 3;
type SignatureMethod = 'draw' | 'upload';

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const STEPS = ['Upload', 'Édition', 'Génération'];

export default function SignTool() {
  const [step, setStep] = useState<Step>(1);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [method, setMethod] = useState<SignatureMethod>('draw');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [sigPos, setSigPos] = useState<SignaturePosition>({ x: 40, y: 40, width: 160, height: 60 });
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Upload dropzone
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setPdfFile(f);
    setPdfUrl(URL.createObjectURL(f));
    setStep(2);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  function handleSignatureConfirm(dataUrl: string) {
    setSignatureDataUrl(dataUrl);
  }

  async function handleUploadSignature(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSignatureDataUrl(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleGenerate() {
    if (!pdfFile || !signatureDataUrl) return;
    setLoading(true);
    setError('');
    setStep(3);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('signatureDataUrl', signatureDataUrl);
      formData.append('page', String(currentPage - 1)); // 0-indexed for pdf-lib
      formData.append('x', String(sigPos.x));
      formData.append('y', String(sigPos.y));
      formData.append('width', String(sigPos.width));
      formData.append('height', String(sigPos.height));
      formData.append('label', label);

      const res = await fetch('/api/sign', { method: 'POST', body: formData });
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfFile.name.replace('.pdf', '')}_signé.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la signature.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step;
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={[
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                step > n ? 'bg-green-500 text-white' :
                step === n ? 'bg-brand-600 text-white' :
                'bg-gray-200 text-gray-400',
              ].join(' ')}>
                {step > n ? '✓' : n}
              </div>
              <span className={`text-sm ${step === n ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-8 bg-gray-200" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card className="max-w-xl">
          <CardBody>
            <div
              {...getRootProps()}
              className={[
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
                isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300',
              ].join(' ')}
            >
              <input {...getInputProps()} />
              <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Glissez un PDF ou DOCX ici</p>
              <p className="mt-1 text-xs text-gray-400">ou cliquez pour parcourir</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && pdfUrl && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* PDF viewer */}
          <div>
            <PDFViewer
              fileUrl={pdfUrl}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              overlay={signatureDataUrl ? (
                <SignatureDragger
                  signatureDataUrl={signatureDataUrl}
                  containerWidth={560}
                  containerHeight={800}
                  onPositionChange={setSigPos}
                />
              ) : undefined}
            />
          </div>

          {/* Signature panel */}
          <Card>
            <CardBody className="space-y-5">
              {/* Method toggle */}
              <div className="flex rounded-lg border border-gray-200 p-1">
                {(['draw', 'upload'] as SignatureMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={[
                      'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                      method === m ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700',
                    ].join(' ')}
                  >
                    {m === 'draw' ? 'Dessiner' : 'Importer une image'}
                  </button>
                ))}
              </div>

              {method === 'draw' && (
                <SignatureCanvas onConfirm={handleSignatureConfirm} />
              )}

              {method === 'upload' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Image de signature (PNG) :</p>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleUploadSignature}
                    className="block text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
                  />
                </div>
              )}

              {signatureDataUrl && (
                <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
                  Signature chargée — positionnez-la sur le document à gauche.
                </div>
              )}

              {/* Optional label */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Texte accompagnant (optionnel)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="ex: Approuvé par Jean Dupont"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!signatureDataUrl || loading}
                loading={loading}
                className="w-full"
              >
                Générer le document signé
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Step 3 — generating */}
      {step === 3 && loading && (
        <Card className="max-w-md">
          <CardBody className="flex flex-col items-center gap-4 py-12">
            <svg className="h-8 w-8 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Génération du document signé…</p>
            <p className="text-xs text-gray-400">Intégration de la signature et du certificat d'audit</p>
          </CardBody>
        </Card>
      )}

      {step === 3 && !loading && !error && (
        <Card className="max-w-md">
          <CardBody className="flex flex-col items-center gap-4 py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900">Document signé avec succès</p>
            <p className="text-sm text-gray-500">Le téléchargement a démarré. Retrouvez le document dans votre dashboard.</p>
            <Button variant="secondary" onClick={() => { setStep(1); setPdfFile(null); setPdfUrl(''); setSignatureDataUrl(''); }}>
              Signer un autre document
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
