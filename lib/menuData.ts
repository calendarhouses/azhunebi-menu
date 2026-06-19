import { resolveLogoUrl, type TenantSettings } from "@/lib/branding";
import { supabase, TENANT_ID, type MenuItemRow } from "@/lib/supabase";

export type MenuDataResult = {
  items: MenuItemRow[];
  categories: string[];
  logoUrl: string;
  error: boolean;
};

type CategoryRow = {
  name: string;
  sort_order: number;
  is_active?: boolean;
};

export async function fetchMenuData(): Promise<MenuDataResult> {
  const [menuResult, categoriesResult, settingsResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*")
      .eq("tenant_id", TENANT_ID)
      .eq("is_available", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("name, sort_order, is_active")
      .eq("tenant_id", TENANT_ID)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tenant_settings")
      .select("tenant_id")
      .eq("tenant_id", TENANT_ID)
      .maybeSingle(),
  ]);

  if (menuResult.error) {
    return {
      items: [],
      categories: [],
      logoUrl: resolveLogoUrl(),
      error: true,
    };
  }

  const menuItemsRaw = (menuResult.data || []) as MenuItemRow[];

  let categories: string[] = [];
  const categoriesUnavailable = Boolean(categoriesResult.error);

  if (!categoriesResult.error && categoriesResult.data) {
    categories = (categoriesResult.data as CategoryRow[])
      .filter((row) => row.is_active !== false)
      .map((row) => row.name);
  }

  if (categoriesUnavailable || categories.length === 0) {
    const seen = new Set<string>();
    for (const item of menuItemsRaw) {
      if (item.category && !seen.has(item.category)) {
        seen.add(item.category);
        categories.push(item.category);
      }
    }
  }

  const activeCategorySet = new Set(categories);

  const categoryOrder = new Map(
    categories.map((name, index) => [name, index])
  );

  const menuItems = menuItemsRaw
    .filter((item) => {
      if (item.is_available === false) return false;
      if (!item.category) return true;
      if (categoriesUnavailable) return true;
      return activeCategorySet.has(item.category);
    })
    .sort((a, b) => {
      const orderA = a.category
        ? (categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER;
      const orderB = b.category
        ? (categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER)
        : Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

  const logoUrl =
    !settingsResult.error && settingsResult.data
      ? resolveLogoUrl(settingsResult.data as TenantSettings)
      : resolveLogoUrl();

  return { items: menuItems, categories, logoUrl, error: false };
}
