type CategoryBarProps = {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

export default function CategoryBar({
  categories,
  activeCategory,
  onChange,
}: CategoryBarProps) {
  return (
    <div className="sticky top-[132px] z-10 border-b border-white/5 bg-[var(--brand-bg,#0a120e)]/95 backdrop-blur-xl sm:top-[140px]">
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => onChange("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === "all"
                ? "bg-amber-400 text-[#0a120e] shadow-[0_8px_24px_rgba(251,191,36,0.18)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            Усе меню
          </button>

          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => onChange(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-amber-400 text-[#0a120e] shadow-[0_8px_24px_rgba(251,191,36,0.18)]"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
