type CategoryBarProps = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

function categoryButtonClass(isActive: boolean) {
  if (isActive) {
    return "shrink-0 rounded-full bg-brand-accent px-5 py-2 text-sm font-medium text-brand-accent-text shadow-[0_4px_14px_rgba(196,165,116,0.2)] transition-all";
  }

  return "shrink-0 rounded-full border border-stone-600/25 bg-brand-surface/80 px-5 py-2 text-sm text-brand-muted transition-all hover:border-stone-500/35 hover:text-stone-200";
}

export default function CategoryBar({
  categories,
  activeCategory,
  onChange,
}: CategoryBarProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-stone-600/20 bg-brand-bg/92 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
          <button
            type="button"
            onClick={() => onChange("all")}
            className={categoryButtonClass(activeCategory === "all")}
          >
            Усе меню
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={categoryButtonClass(activeCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
