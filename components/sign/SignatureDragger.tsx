'use client';

import { useState, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SignatureDraggerProps {
  signatureDataUrl: string;
  containerWidth: number;
  containerHeight: number;
  onPositionChange: (pos: Position & { width: number; height: number }) => void;
}

const DEFAULT_W = 160;
const DEFAULT_H = 60;

export default function SignatureDragger({
  signatureDataUrl,
  containerWidth,
  containerHeight,
  onPositionChange,
}: SignatureDraggerProps) {
  const [pos, setPos] = useState<Position>({ x: 40, y: 40 });
  const [size, setSize] = useState({ width: DEFAULT_W, height: DEFAULT_H });
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };

    function onMove(ev: MouseEvent) {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      const newX = Math.max(0, Math.min(containerWidth - size.width, dragStart.current.ox + dx));
      const newY = Math.max(0, Math.min(containerHeight - size.height, dragStart.current.oy + dy));
      setPos({ x: newX, y: newY });
      onPositionChange({ x: newX, y: newY, ...size });
    }

    function onUp() {
      dragStart.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleResize(e: React.ChangeEvent<HTMLInputElement>) {
    const scale = parseFloat(e.target.value);
    const newSize = { width: Math.round(DEFAULT_W * scale), height: Math.round(DEFAULT_H * scale) };
    setSize(newSize);
    onPositionChange({ ...pos, ...newSize });
  }

  return (
    <div>
      {/* Draggable signature */}
      <div
        style={{ left: pos.x, top: pos.y, width: size.width, height: size.height, position: 'absolute', cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        className="select-none rounded border-2 border-dashed border-brand-400"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signatureDataUrl} alt="Signature" className="h-full w-full object-contain" draggable={false} />
      </div>

      {/* Size control — rendered outside the PDF overlay */}
      <div className="mt-64 flex items-center gap-3 text-sm text-gray-600">
        <span>Taille :</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          defaultValue="1"
          onChange={handleResize}
          className="w-32 accent-brand-600"
        />
      </div>
    </div>
  );
}
