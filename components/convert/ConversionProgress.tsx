'use client';

import { useEffect, useState } from 'react';

interface ConversionProgressProps {
  isGotenberg: boolean;
}

export default function ConversionProgress({ isGotenberg }: ConversionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);

  useEffect(() => {
    // Simulate progress up to 90% while waiting
    const interval = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 8 : p));
    }, 600);

    // Show cold-start warning for Gotenberg calls after 5 s
    let coldStartTimer: ReturnType<typeof setTimeout>;
    if (isGotenberg) {
      coldStartTimer = setTimeout(() => setShowColdStartMessage(true), 5000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(coldStartTimer);
    };
  }, [isGotenberg]);

  return (
    <div className="mt-6 space-y-3">
      {showColdStartMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <svg className="h-4 w-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Démarrage du moteur de conversion… (peut prendre ~30 secondes)
        </div>
      )}

      <div>
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Conversion en cours…</span>
          <span>{Math.round(progress)} %</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
