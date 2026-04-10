'use client';

import { useRef } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import Button from '@/components/ui/Button';

interface SignatureCanvasProps {
  onConfirm: (dataUrl: string) => void;
}

export default function SignatureCanvas({ onConfirm }: SignatureCanvasProps) {
  const sigRef = useRef<ReactSignatureCanvas>(null);

  function handleConfirm() {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
    onConfirm(dataUrl);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Dessinez votre signature :</p>
      <div className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <ReactSignatureCanvas
          ref={sigRef}
          penColor="#1e293b"
          canvasProps={{ width: 480, height: 160, className: 'block' }}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => sigRef.current?.clear()}>
          Effacer
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          Utiliser cette signature
        </Button>
      </div>
    </div>
  );
}
