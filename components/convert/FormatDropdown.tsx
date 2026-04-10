'use client';

import { CONVERSION_MATRIX, type FileFormat } from '@/lib/formats';

interface FormatDropdownProps {
  label: string;
  value: FileFormat;
  options: FileFormat[];
  onChange: (fmt: FileFormat) => void;
  disabled?: boolean;
}

export default function FormatDropdown({ label, value, options, onChange, disabled }: FormatDropdownProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as FileFormat)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-9 text-sm font-medium text-gray-800 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          {options.map((fmt) => (
            <option key={fmt} value={fmt}>{fmt}</option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
        </svg>
      </div>
    </div>
  );
}
