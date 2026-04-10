'use client';

import { useState } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { canSwap, type FileFormat } from '@/lib/formats';

interface SwapButtonProps {
  from: FileFormat;
  to: FileFormat;
  onSwap: () => void;
}

export default function SwapButton({ from, to, onSwap }: SwapButtonProps) {
  const [spinning, setSpinning] = useState(false);
  const swappable = canSwap(from, to);

  function handleClick() {
    if (!swappable) return;
    setSpinning(true);
    onSwap();
    setTimeout(() => setSpinning(false), 400);
  }

  const btn = (
    <button
      type="button"
      onClick={handleClick}
      disabled={!swappable}
      aria-label="Inverser les formats"
      className={[
        'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
        swappable
          ? 'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100'
          : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300',
      ].join(' ')}
    >
      <svg
        className={`h-5 w-5 transition-transform duration-300 ${spinning ? 'rotate-180' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );

  if (!swappable) {
    return (
      <Tooltip text="Conversion inverse non disponible">
        {btn}
      </Tooltip>
    );
  }

  return btn;
}
