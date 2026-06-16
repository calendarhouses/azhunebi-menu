type CategoryBarProps = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

function categoryButtonClass(isActive: boolean) {
  if (isActive) {
    return "shrink-0 rounded-full bg-amber-500 px-5 py-2 text-sm font-medium text-amber-950 transition-all";
  }

  return "shrink-0 rounded-full bg-zinc-800/50 px-5 py-2 text-sm text-zinc-400 transition-all hover:bg-zinc-800";
}

export default function CategoryBar({
  categories,
  activeCategory,
  onChange,
}: CategoryBarProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
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
