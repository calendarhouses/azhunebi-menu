"use client";

type AccessBlockedScreenProps = {
  onRetry?: () => void;
  checking?: boolean;
};

export default function AccessBlockedScreen({
  onRetry,
  checking = false,
}: AccessBlockedScreenProps) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-muted">
        Аж у небі
      </p>
      <h1 className="mt-4 font-display text-3xl text-brand-ink">
        {checking ? "Перевіряємо доступ…" : "Потрібен QR-код"}
      </h1>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-brand-muted">
        {checking
          ? "Зачекайте хвильку."
          : "Меню відкривається лише після сканування QR-коду будиночка або столика в комплексі."}
      </p>
      {!checking && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-brand-accent-text"
        >
          Перевірити ще раз
        </button>
      ) : null}
    </main>
  );
}
