import type { MenuItemRow } from "@/lib/supabase";

export const DEFAULT_LOGO_PATH = "/logo.png";

export type TenantSettings = {
  tenant_id?: string;
  logo_url: string | null;
};

export function resolveLogoUrl(settings?: { logo_url?: string | null } | null) {
  return settings?.logo_url || DEFAULT_LOGO_PATH;
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
