import { resolveLogoUrl, type TenantSettings } from "@/lib/branding";
import { supabase, TENANT_ID, type MenuItemRow } from "@/lib/supabase";

export type MenuDataResult = {
  items: MenuItemRow[];
  categories: string[];
  logoUrl: string;
  error: boolean;
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
      .select("name, sort_order")
      .eq("tenant_id", TENANT_ID)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tenant_settings")
      .select("tenant_id, logo_url")
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

  let categories: string[];
  if (!categoriesResult.error && categoriesResult.data?.length) {
    categories = categoriesResult.data.map((row) => row.name);
  } else {
    categories = [
      ...new Set(
        menuItemsRaw
          .map((item) => item.category)
          .filter((value): value is string => Boolean(value))
      ),
    ];
  }

  const activeCategorySet = new Set(categories);
  const menuItems = menuItemsRaw.filter(
    (item) => !item.category || activeCategorySet.has(item.category)
  );

  const logoUrl =
    !settingsResult.error && settingsResult.data
      ? resolveLogoUrl(settingsResult.data as TenantSettings)
      : resolveLogoUrl();

  return { items: menuItems, categories, logoUrl, error: false };
}
