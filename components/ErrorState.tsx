type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export default function ErrorState({
  message = "Не вдалося завантажити меню",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-6 py-12 text-center">
      <p className="text-base text-white/80">{message}</p>
      <p className="mt-2 text-sm text-white/45">
        Перевірте з&apos;єднання та спробуйте ще раз
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#0a120e]"
      >
        Спробувати знову
      </button>
    </div>
  );
}
