const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  "https://azhunebi-bot-six.vercel.app/api/admin";

type AdminCheckResult = {
  isAdmin: boolean;
  canManageAdmins: boolean;
  username: string | null;
};

type AdminLoadResult = {
  dishes: unknown[];
  categories: unknown[];
  settings: { logo_url?: string | null } | null;
  admins?: { telegram_username: string; created_at: string }[];
  canManageAdmins: boolean;
  username: string | null;
};

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

export async function checkAdminAccess(): Promise<AdminCheckResult> {
  const initData = getInitData();

  if (!initData) {
    return { isAdmin: false, canManageAdmins: false, username: null };
  }

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, action: "check" }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return { isAdmin: false, canManageAdmins: false, username: null };
    }

    return {
      isAdmin: Boolean(result.isAdmin),
      canManageAdmins: Boolean(result.canManageAdmins),
      username: result.username || null,
    };
  } catch {
    return { isAdmin: false, canManageAdmins: false, username: null };
  }
}

export async function adminRequest<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T & { ok: true }> {
  const initData = getInitData();

  if (!initData) {
    throw new Error("Відкрийте адмін-панель через Telegram-бота.");
  }

  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, action, ...payload }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Admin request failed");
  }

  return result;
}

export async function loadAdminPanelData() {
  return adminRequest<AdminLoadResult>("load");
}

export async function adminLoadSessionsDashboard() {
  return adminRequest<{ cabins: import("@/lib/runningTab").CabinDashboardCard[] }>(
    "loadSessionsDashboard"
  );
}

export async function adminLoadSessionDetail(sessionId: string) {
  return adminRequest<import("@/lib/runningTab").SessionDetailData>(
    "loadSessionDetail",
    { sessionId }
  );
}

export async function adminMoveOrderToHouse(payload: {
  orderId: string;
  cabinNumber: number;
  sessionId: string;
}) {
  return adminRequest<import("@/lib/runningTab").SessionDetailData>(
    "moveOrderToHouse",
    payload
  );
}

export async function adminCheckOutSession(sessionId: string) {
  return adminRequest<{ sessionId: string; cabinNumber: number; finalTotal: number }>(
    "checkOutSession",
    { sessionId }
  );
}

export async function adminLoadClosedSessionsArchive() {
  return adminRequest<{
    sessions: import("@/lib/runningTab").ClosedSessionArchiveItem[];
  }>("loadClosedSessionsArchive");
}

/** Removes an order from the house bill (admin panel only, no guest DM). */
export async function adminCancelOrder(payload: {
  orderId: string;
  sessionId: string;
}) {
  return adminRequest<import("@/lib/runningTab").SessionDetailData>(
    "cancelOrder",
    payload
  );
}

export async function adminDeleteClosedSession(sessionId: string) {
  return adminRequest<{ sessionId: string }>("deleteClosedSession", { sessionId });
}

export async function adminUpdateOrderCart(payload: {
  orderId: string;
  sessionId: string;
  cart: import("@/lib/orderStatus").OrderCartLine[];
}) {
  return adminRequest<import("@/lib/runningTab").SessionDetailData>(
    "updateOrderCart",
    payload
  );
}

export async function adminSettleOrderLine(payload: {
  orderId: string;
  sessionId: string;
  lineIndex: number;
  quantity?: number;
}) {
  return adminRequest<import("@/lib/runningTab").SessionDetailData>(
    "settleOrderLine",
    payload
  );
}

export async function adminSettleAllSessionOrders(sessionId: string) {
  return adminRequest<import("@/lib/runningTab").SessionDetailData>(
    "settleAllSessionOrders",
    { sessionId }
  );
}

/**
 * Uploads a compressed image via bot service role (bypasses Storage RLS).
 * Direct anon uploads to xata-public fail on the new Supabase project.
 */
export async function uploadDishImage(
  blob: Blob,
  options: { ext?: string; contentType?: string } = {}
): Promise<string> {
  const ext = options.ext || "webp";
  const contentType = options.contentType || blob.type || "image/webp";

  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = reader.result;

      if (typeof value !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }

      const base64 = value.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to read file"));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });

  const result = await adminRequest<{ imageUrl: string }>("uploadDishImage", {
    fileBase64,
    contentType,
    ext,
    fileName: `dish.${ext}`,
  });

  if (!result.imageUrl) {
    throw new Error("Помилка завантаження фото: порожня відповідь сервера");
  }

  return result.imageUrl;
}

export async function uploadAdminLogo(file: File) {
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = reader.result;

      if (typeof value !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }

      const base64 = value.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to read file"));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  return adminRequest<{ logoUrl: string }>("updateLogo", {
    fileBase64,
    contentType: file.type,
    fileName: file.name,
  });
}
