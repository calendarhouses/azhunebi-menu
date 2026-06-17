"use client";

import CategorySelect from "@/components/CategorySelect";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import { adminRequest, uploadDishImage } from "@/lib/adminApi";
import { compressImage, formatFileSize, type CompressedImage } from "@/lib/imageUtils";
import type { MenuItemRow } from "@/lib/supabase";
import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";

type CategoryRow = { id: string; name: string; sort_order: number };

// Pure sanity guard — real photos never hit this after compression.
const MAX_COMPRESSED_BYTES = 1.5 * 1024 * 1024;
const COMPRESS_FAIL_MESSAGE = "Не вдалося стиснути фото. Спробуйте інше.";

function isValidImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

type Props = {
  dish: MenuItemRow | null;
  categories: CategoryRow[];
  onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onClose: () => void;
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-brand-input px-4 py-3 text-base text-white outline-none transition focus:border-brand-accent focus:ring-1 focus:ring-brand-accent placeholder:text-white/25";

const labelCls =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/35";

export default function AdminDishForm({
  dish,
  categories,
  onSaved,
  onDeleted,
  onClose,
}: Props) {
  const isEdit = Boolean(dish);

  // ----- form fields -----
  const [name, setName] = useState(dish?.name ?? "");
  const [price, setPrice] = useState(dish?.price ? String(dish.price) : "");
  const [weightG, setWeightG] = useState(
    dish?.weight_g ? String(dish.weight_g) : ""
  );
  const [category, setCategory] = useState(dish?.category ?? "");
  const [description, setDescription] = useState(dish?.description ?? "");
  const [allergens, setAllergens] = useState(dish?.allergens ?? "");
  const [isAvailable, setIsAvailable] = useState(dish?.is_available ?? true);

  // ----- image state -----
  // serverUrl: what's stored in the DB (or will be after upload)
  const [serverUrl, setServerUrl] = useState(dish?.image_url ?? "");
  // pendingImage: compressed image ready to upload on submit
  const [pendingImage, setPendingImage] = useState<CompressedImage | null>(null);
  // previewUrl: local object URL shown while pendingFile exists
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // converting: while compression is running
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  // compressedSize: size of the compressed file for display
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  // isDragging: drag-over visual state
  const [isDragging, setIsDragging] = useState(false);
  const [serverImageFailed, setServerImageFailed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- save/delete state -----
  // "idle" | "uploading" | "saving"
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const busy = submitStage !== "idle";
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState(false);

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setServerImageFailed(false);
  }, [dish?.id, serverUrl, previewUrl]);

  // ----- image handling -----
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setConvertError("Оберіть зображення (JPG, PNG, WEBP, HEIC)");
      return;
    }

    setConvertError("");
    setConverting(true);
    setPendingImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCompressedSize(null);

    try {
      console.log(`[dish-photo] before: ${Math.round(file.size / 1024)} KB`);

      const compressed = await compressImage(file);

      console.log(
        `[dish-photo] after: ${Math.round(compressed.blob.size / 1024)} KB (${compressed.type})`
      );

      if (compressed.blob.size > MAX_COMPRESSED_BYTES) {
        console.error(
          `[dish-photo] still too big — ${Math.round(compressed.blob.size / 1024)} KB`
        );
        setConvertError(COMPRESS_FAIL_MESSAGE);
        return;
      }

      const url = URL.createObjectURL(compressed.blob);
      setPendingImage(compressed);
      setPreviewUrl(url);
      setCompressedSize(compressed.blob.size);
    } catch (err) {
      setConvertError(
        err instanceof Error ? err.message : "Помилка конвертації"
      );
    } finally {
      setConverting(false);
    }
  }

  function handleDragOver(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange() {
    const file = fileInputRef.current?.files?.[0];
    if (file) handleFile(file);
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingImage(null);
    setServerUrl("");
    setServerImageFailed(false);
    setCompressedSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ----- submit -----
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Frontend validation — category is required
    if (!category.trim()) {
      setCategoryError(true);
      return;
    }
    setCategoryError(false);

    try {
      let finalImageUrl = serverUrl;

      // Step 1: upload the compressed image to Supabase Storage (never the raw input file)
      if (pendingImage) {
        if (pendingImage.blob.size > MAX_COMPRESSED_BYTES) {
          setError(COMPRESS_FAIL_MESSAGE);
          return;
        }

        setSubmitStage("uploading");
        finalImageUrl = await uploadDishImage(pendingImage.blob, {
          ext: pendingImage.ext,
          contentType: pendingImage.type,
        });
      }

      // Step 2: save dish record to the database
      setSubmitStage("saving");
      await adminRequest("saveDish", {
        id: dish?.id ?? undefined,
        name: name.trim(),
        price: Number(price),
        category: category.trim() || null,
        description: description.trim() || null,
        image_url: finalImageUrl || null,
        allergens: allergens.trim() || null,
        weight_g: weightG ? Number(weightG) : null,
        is_available: isAvailable,
      });

      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти");
    } finally {
      setSubmitStage("idle");
    }
  }

  // ----- delete -----
  async function handleDelete() {
    if (!dish) return;
    if (!window.confirm(`Видалити «${dish.name}»?`)) return;

    setSubmitStage("saving");
    setError("");

    try {
      await adminRequest("deleteDish", { id: dish.id });
      await onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити");
    } finally {
      setSubmitStage("idle");
    }
  }

  const remoteUrl =
    isValidImageUrl(serverUrl) && !serverImageFailed ? serverUrl : null;
  const displayUrl = previewUrl ?? remoteUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo upload zone */}
      <div>
        <span className={labelCls}>Фото страви</span>

        {displayUrl ? (
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Превью"
              className="h-full w-full object-cover"
              onError={() => {
                if (!previewUrl) {
                  setServerImageFailed(true);
                }
              }}
            />
            {compressedSize !== null && (
              <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white/80">
                {(pendingImage?.ext || "webp").toUpperCase()} ·{" "}
                {formatFileSize(compressedSize)}
              </span>
            )}
            <button
              type="button"
              onClick={clearImage}
              className="absolute bottom-3 right-3 z-10 rounded-full bg-red-500/80 px-3 py-1 text-xs text-white backdrop-blur-sm"
            >
              Видалити фото
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={converting}
              className={`relative h-48 w-full overflow-hidden rounded-xl border-2 border-dashed transition ${
                isDragging
                  ? "border-brand-accent bg-brand-accent/10"
                  : "border-white/10 hover:border-white/20"
              } disabled:opacity-60`}
            >
              {!converting ? <ImagePlaceholder large /> : null}
              <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/55 via-transparent to-transparent pb-4">
                {converting ? (
                  <>
                    <svg
                      className="mb-2 h-6 w-6 animate-spin text-brand-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                      />
                    </svg>
                    <span className="text-xs text-white/80">Стиснення фото…</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-white/80">
                      Перетягніть або{" "}
                      <span className="text-brand-accent">оберіть файл</span>
                    </span>
                    <span className="mt-1 text-xs text-white/45">
                      JPG, PNG, HEIC → стиснення до ~250 KB
                    </span>
                  </>
                )}
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </>
        )}

        {convertError && (
          <p className="mt-1.5 text-xs text-red-400">{convertError}</p>
        )}
      </div>

      {/* Name */}
      <label className="block">
        <span className={labelCls}>Назва *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Млинці з сиром"
          required
        />
      </label>

      {/* Price + Weight row */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>Ціна (₴) *</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
            placeholder="150"
            required
          />
        </label>
        <label className="block">
          <span className={labelCls}>Вага (г)</span>
          <input
            type="number"
            min="0"
            value={weightG}
            onChange={(e) => setWeightG(e.target.value)}
            className={inputCls}
            placeholder="250"
          />
        </label>
      </div>

      {/* Category */}
      <div>
        <span className={labelCls}>
          Категорія <span className="text-red-400">*</span>
        </span>
        {categories.length > 0 ? (
          <CategorySelect
            value={category}
            onChange={(v) => { setCategory(v); setCategoryError(false); }}
            options={[
              { value: "", label: "Оберіть категорію…" },
              ...categories.map((c) => ({ value: c.name, label: c.name })),
            ]}
            error={categoryError}
          />
        ) : (
          <input
            value={category}
            onChange={(e) => { setCategory(e.target.value); setCategoryError(false); }}
            className={`${inputCls} ${categoryError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
            placeholder="Наприклад: Сніданки"
          />
        )}
        {categoryError && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
            <span>⚠️</span> Будь ласка, оберіть категорію для страви
          </p>
        )}
      </div>

      {/* Description */}
      <label className="block">
        <span className={labelCls}>Опис</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Смачна страва від нашого шеф-кухаря"
        />
      </label>

      {/* Allergens */}
      <label className="block">
        <span className={labelCls}>Алергени</span>
        <input
          value={allergens}
          onChange={(e) => setAllergens(e.target.value)}
          className={inputCls}
          placeholder="Глютен, молоко"
        />
      </label>

      {/* Available toggle */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-brand-input px-4 py-3">
        <div>
          <p className="text-sm text-white">Показувати в меню</p>
          <p className="text-xs text-white/30">
            {isAvailable ? "Доступна для замовлення" : "Стоп-лист"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isAvailable}
          onClick={() => setIsAvailable((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
            isAvailable ? "bg-brand-accent" : "bg-white/15"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
              isAvailable ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={busy || converting}
        className="w-full rounded-xl bg-brand-accent py-3 text-sm font-semibold text-brand-accent-text transition disabled:opacity-50 active:scale-[0.98]"
      >
        {submitStage === "uploading" && (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-brand-accent-text"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            Завантаження фото…
          </span>
        )}
        {submitStage === "saving" && "Збереження…"}
        {submitStage === "idle" && (isEdit ? "Зберегти зміни" : "Додати страву")}
      </button>

      {/* Delete button — edit mode only */}
      {isEdit && (
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-medium text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          Видалити страву
        </button>
      )}
    </form>
  );
}
