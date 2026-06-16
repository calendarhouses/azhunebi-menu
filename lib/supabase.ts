import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MenuItemRow = {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  description: string | null;
  is_available: boolean;
  created_at: string;
};

export const TENANT_ID = "3767b167-cc5f-4d4d-ae59-95e8bc6f795b";
