"use client";

import { adminRequest, uploadDishImage } from "@/lib/adminApi";
import { convertToWebP, formatFileSize } from "@/lib/imageUtils";
import type { MenuItemRow } from "@/lib/supabase";
import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";

type CategoryRow = { id: string; name: string; sort_order: number };

type Props = {
  dish: MenuItemRow | null;
  categories: CategoryRow[];
  onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onClose: () => void;
};

const inputCls =
  "w-full rounded-lg border border-white/10 bg-brand-input px-4 py-3 text-sm text-white outline-none transition focus:border-brand-accent focus:ring-1 focus:ring-brand-accent placeholder:text-white/25";

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
  // pendingBlob: WebP Blob ready to be uploaded on submit
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  // pendingName: original filename for the server
  const [pendingName, setPendingName] = useState("");
  // previewUrl: local object URL shown while pendingBlob exists
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // converting: while canvas is working
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  // webpSize: size of the converted blob for display
  const [webpSize, setWebpSize] = useState<number | null>(null);
  // isDragging: drag-over visual state
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- save/delete state -----
  // "idle" | "uploading" | "saving"
  const [submitStage, setSubmitStage] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const busy = submitStage !== "idle";
  const [error, setError] = useState("");

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ----- image handling -----
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setConvertError("Оберіть зображення (JPG, PNG, WEBP, HEIC)");
      return;
    }

    setConvertError("");
    setConverting(true);
    setPendingBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setWebpSize(null);

    try {
      const webpBlob = await convertToWebP(file);
      const url = URL.createObjectURL(webpBlob);
      setPendingBlob(webpBlob);
      setPendingName(file.name);
      setPreviewUrl(url);
      setWebpSize(webpBlob.size);
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
    setPendingBlob(null);
    setPendingName("");
    setServerUrl("");
    setWebpSize(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ----- submit -----
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      let finalImageUrl = serverUrl;

      // Step 1: upload WebP to Supabase Storage if user picked a new image
      if (pendingBlob) {
        setSubmitStage("uploading");
        finalImageUrl = await uploadDishImage(pendingBlob);
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

  const displayUrl = previewUrl ?? (serverUrl || null);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo upload zone */}
      <div>
        <span className={labelCls}>Фото страви</span>

        {displayUrl ? (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Превью"
              className="h-40 w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-3">
              {webpSize && (
                <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white/80">
                  WebP · {formatFileSize(webpSize)}
                </span>
              )}
              <button
                type="button"
                onClick={clearImage}
                className="rounded-full bg-red-500/80 px-3 py-1 text-xs text-white backdrop-blur-sm"
              >
                Видалити фото
              </button>
            </div>
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
              className={`flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                isDragging
                  ? "border-brand-accent bg-brand-accent/10"
                  : "border-white/10 bg-brand-input hover:border-white/20"
              } disabled:opacity-60`}
            >
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
                  <span className="text-xs text-zinc-400">
                    Конвертація в WebP…
                  </span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-2 h-7 w-7 text-white/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <span className="text-sm font-medium text-zinc-400">
                    Перетягніть або{" "}
                    <span className="text-brand-accent">оберіть файл</span>
                  </span>
                  <span className="mt-1 text-xs text-white/25">
                    JPG, PNG, HEIC → автоконвертація в WebP
                  </span>
                </>
              )}
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
      <label className="block">
        <span className={labelCls}>Категорія</span>
        {categories.length > 0 ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
          >
            <option value="">Без категорії</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputCls}
            placeholder="Наприклад: Сніданки"
          />
        )}
      </label>

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
