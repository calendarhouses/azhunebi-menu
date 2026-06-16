"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Пошук страв..."
        className="w-full rounded-2xl border border-stone-700/35 bg-brand-surface py-3.5 pl-11 pr-4 text-sm text-stone-100 placeholder:text-stone-500 outline-none transition focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
      />
    </div>
  );
}
