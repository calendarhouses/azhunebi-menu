const ADMIN_API_URL = "https://azhunebi-bot.vercel.app/api/admin";

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
