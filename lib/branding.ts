import type { MenuItemRow } from "@/lib/supabase";

export const BASE_PATH = "/azhunebi-menu";
export const DEFAULT_LOGO_PATH = `${BASE_PATH}/logo2.webp`;

export type TenantSettings = {
  tenant_id?: string;
  logo_url: string | null;
};

export function resolveAssetUrl(url: string) {
  if (!url) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalized = url.startsWith("/") ? url : `/${url}`;

  if (normalized.startsWith(BASE_PATH)) {
    return normalized;
  }

  return `${BASE_PATH}${normalized}`;
}

export function resolveLogoUrl(settings?: { logo_url?: string | null } | null) {
  const url = settings?.logo_url?.trim() || DEFAULT_LOGO_PATH;
  return resolveAssetUrl(url);
}

export function formatWeight(weightG?: number | null) {
  if (!weightG) {
    return null;
  }

  if (weightG >= 1000) {
    return `${(weightG / 1000).toFixed(weightG % 1000 === 0 ? 0 : 1)} кг`;
  }

  return `${weightG} г`;
}

export function formatAllergens(allergens?: string | null) {
  if (!allergens?.trim()) {
    return null;
  }

  return allergens.trim();
}

export type MenuItemForm = Pick<
  MenuItemRow,
  "name" | "price" | "category" | "description" | "image_url" | "allergens" | "weight_g" | "is_available"
>;
