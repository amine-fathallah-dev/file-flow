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
  width: number;
  height: number;
  onPositionChange: (pos: Position & { width: number; height: number }) => void;
}

export default function SignatureDragger({
  signatureDataUrl,
  containerWidth,
  containerHeight,
  width,
  height,
  onPositionChange,
}: SignatureDraggerProps) {
  const [pos, setPos] = useState<Position>({ x: 40, y: 40 });
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };

    function onMove(ev: MouseEvent) {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      const newX = Math.max(0, Math.min(containerWidth - width, dragStart.current.ox + dx));
      const newY = Math.max(0, Math.min(containerHeight - height, dragStart.current.oy + dy));
      setPos({ x: newX, y: newY });
      onPositionChange({ x: newX, y: newY, width, height });
    }

    function onUp() {
      dragStart.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div
      style={{ left: pos.x, top: pos.y, width, height, position: 'absolute', cursor: 'grab', zIndex: 10 }}
      onMouseDown={handleMouseDown}
      className="select-none rounded border-2 border-dashed border-brand-400"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={signatureDataUrl} alt="Signature" className="h-full w-full object-contain" draggable={false} />
    </div>
  );
}
