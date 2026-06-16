"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Пошук страв..."
        className="w-full rounded-2xl border border-zinc-800/50 bg-zinc-900 py-3.5 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
      />
    </div>
  );
}
