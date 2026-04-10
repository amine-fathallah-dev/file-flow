'use client';

import { useRef } from 'react';

export interface TextAnnotationData {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  page: number; // 0-indexed
}

interface TextBlockProps {
  annotation: TextAnnotationData;
  containerWidth: number;
  containerHeight: number;
  onUpdate: (id: string, partial: Partial<TextAnnotationData>) => void;
  onDelete: (id: string) => void;
}

export default function TextBlock({
  annotation,
  containerWidth,
  containerHeight,
  onUpdate,
  onDelete,
}: TextBlockProps) {
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: annotation.x, oy: annotation.y };

    function onMove(ev: MouseEvent) {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      const newX = Math.max(0, Math.min(containerWidth - 60, dragStart.current.ox + dx));
      const newY = Math.max(0, Math.min(containerHeight - 24, dragStart.current.oy + dy));
      onUpdate(annotation.id, { x: newX, y: newY });
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
      style={{ position: 'absolute', left: annotation.x, top: annotation.y, zIndex: 20, cursor: 'grab' }}
      onMouseDown={handleMouseDown}
      className="select-none"
    >
      <div className="flex items-center gap-1 rounded border border-dashed border-indigo-400 bg-white/85 px-1.5 py-0.5 shadow-sm">
        <input
          value={annotation.text}
          onChange={(e) => onUpdate(annotation.id, { text: e.target.value })}
          placeholder="Votre texte…"
          style={{
            fontSize: annotation.fontSize,
            width: Math.max(80, annotation.text.length * (annotation.fontSize * 0.58) + 24),
          }}
          className="bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(annotation.id)}
          className="ml-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-400 text-[10px] font-bold text-white hover:bg-red-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}
