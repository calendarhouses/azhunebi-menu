// Renders a premium dark receipt card to JPEG (base64) via html2canvas.
// All styles are inline hex/rgb — html2canvas cannot parse Tailwind oklch vars.

export type OrderCardItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderCardData = {
  guestName: string;
  house: string;
  items: OrderCardItem[];
  total: number;
  scheduledFor?: string | null;
  comment?: string | null;
};

const FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif";

const C = {
  bg: "#09090b",
  card: "#18181b",
  panel: "#27272a",
  border: "#3f3f46",
  white: "#ffffff",
  light: "#f4f4f5",
  muted: "#a1a1aa",
  accent: "#f59e0b",
  accentSoft: "rgba(245,158,11,0.12)",
};

function svg(path: string, size = 20): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;display:block">${path}</svg>`;
}

const ICONS = {
  bell: svg(
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
  ),
  user: svg(
    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
  ),
  home: svg(
    '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>'
  ),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chat: svg(
    '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/>'
  ),
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDateTime(iso?: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Icon + label on the left, value on the right — strict flex row. */
function metaRow(icon: string, label: string, value: string): string {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        ${icon}
        <span style="font-size:18px;color:${C.muted};font-weight:500">${label}</span>
      </div>
      <span style="font-size:18px;font-weight:700;color:${C.light};text-align:right;white-space:nowrap">${value}</span>
    </div>`;
}

function itemRow(item: OrderCardItem): string {
  const total = item.price * item.quantity;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0">
      <span style="font-size:17px;font-weight:600;color:${C.white};min-width:0;flex:1">${esc(item.name)}<span style="color:${C.muted};font-weight:500"> ×${item.quantity}</span></span>
      <span style="font-size:17px;font-weight:700;color:${C.light};white-space:nowrap;flex-shrink:0">${total} ₴</span>
    </div>`;
}

function buildCardHtml(data: OrderCardData): string {
  const itemsCount = data.items.reduce((sum, i) => sum + i.quantity, 0);

  const metaRows = [
    metaRow(ICONS.home, "Будинок", esc(data.house || "—")),
    data.scheduledFor
      ? metaRow(ICONS.clock, "Подача", formatDateTime(data.scheduledFor))
      : "",
  ].join("");

  const itemsHtml = data.items.map(itemRow).join("");

  const commentBlock = data.comment
    ? `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid ${C.border}">
      ${ICONS.chat}
      <span style="font-size:16px;color:${C.muted};line-height:1.5;flex:1">${esc(data.comment)}</span>
    </div>`
    : "";

  return `
  <div style="width:800px;padding:40px;background:${C.bg};font-family:${FONT};box-sizing:border-box">
    <div style="background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden">

      <div style="height:4px;background:linear-gradient(90deg, ${C.accent}, #fbbf24)"></div>

      <div style="padding:32px 36px 36px">

        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:12px">
            ${ICONS.bell}
            <span style="font-size:28px;font-weight:800;color:${C.white};letter-spacing:-0.3px">Нове замовлення</span>
          </div>
          <span style="font-size:14px;font-weight:700;color:${C.accent};background:${C.accentSoft};padding:8px 14px;border-radius:999px;white-space:nowrap;border:1px solid rgba(245,158,11,0.25)">${itemsCount} страв</span>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-top:20px">
          ${ICONS.user}
          <span style="font-size:22px;font-weight:700;color:${C.white}">${esc(data.guestName || "Гість")}</span>
        </div>

        <div style="height:1px;background:${C.border};margin:20px 0"></div>

        ${metaRows}

        <div style="background:${C.panel};border-radius:12px;padding:16px 20px;margin-top:8px">
          ${itemsHtml}
        </div>

        <div style="border-top:1px solid ${C.border};margin-top:24px;padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:16px">
          <span style="font-size:20px;font-weight:700;color:${C.light}">Сума</span>
          <span style="font-size:32px;font-weight:900;color:${C.accent};letter-spacing:-0.5px">${data.total} ₴</span>
        </div>

        ${commentBlock}
      </div>
    </div>
  </div>`;
}

export async function captureOrderCard(
  data: OrderCardData
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-9999px";
  host.style.top = "0";
  host.style.width = "800px";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  host.innerHTML = buildCardHtml(data);

  document.body.appendChild(host);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const target = host.firstElementChild as HTMLElement;

    const canvas = await html2canvas(target, {
      width: 800,
      scale: 2,
      backgroundColor: C.bg,
      logging: false,
      useCORS: true,
    });

    return canvas.toDataURL("image/jpeg", 0.9);
  } catch (error) {
    console.error("[order-card] capture failed", error);
    return null;
  } finally {
    document.body.removeChild(host);
  }
}
