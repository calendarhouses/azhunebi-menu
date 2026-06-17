// Renders a premium receipt card to JPEG (base64) via html2canvas.
// Brand palette matches app/globals.css — inline hex/rgb only for html2canvas.

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

const TEXT = 19;
const ICON = 22;

// «Аж у небі» brand tokens
const C = {
  bg: "#221f1c",
  card: "#2f2b27",
  panel: "#3a3530",
  input: "#1a1816",
  border: "#4a4440",
  white: "#fafaf9",
  muted: "#a8a29e",
  accent: "#c4a574",
  accentHover: "#d6bc94",
  accentSoft: "rgba(196,165,116,0.14)",
  accentBorder: "rgba(196,165,116,0.28)",
};

/** Bare icon (no tile), centred inside a fixed box so every row aligns. */
function icon(paths: string, color = C.accent): string {
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${ICON}px;height:${ICON}px;flex-shrink:0"><svg width="${ICON}" height="${ICON}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:block">${paths}</svg></span>`;
}

const ICONS = {
  order: icon(
    '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h4"/>'
  ),
  user: icon(
    '<circle cx="12" cy="8" r="3.5"/><path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/>'
  ),
  home: icon(
    '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>'
  ),
  clock: icon(
    '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l2.5 1.5"/>'
  ),
  chat: icon(
    '<path d="M7 18l-3 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9.5L7 18z"/>'
  ),
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 1 страва · 2–4 страви · 5+ страв */
export function dishCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} страва`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} страви`;
  }
  return `${count} страв`;
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

function text(size = TEXT, weight = 500, color = C.white): string {
  return `font-size:${size}px;font-weight:${weight};color:${color};line-height:1.3`;
}

function metaRow(iconHtml: string, label: string, value: string): string {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 0">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        ${iconHtml}
        <span style="${text(TEXT, 500, C.muted)}">${label}</span>
      </div>
      <span style="${text(TEXT, 600, C.white)};text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums">${value}</span>
    </div>`;
}

function itemRow(item: OrderCardItem, isLast: boolean): string {
  const lineTotal = item.price * item.quantity;
  const border = isLast ? "" : `border-bottom:1px solid ${C.border};`;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 0;${border}">
      <span style="${text(TEXT, 500, C.white)};min-width:0;flex:1">${esc(item.name)}<span style="color:${C.muted}"> ×${item.quantity}</span></span>
      <span style="${text(TEXT, 600, C.white)};white-space:nowrap;flex-shrink:0;font-variant-numeric:tabular-nums">${lineTotal} ₴</span>
    </div>`;
}

function buildCardHtml(data: OrderCardData): string {
  const itemsCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
  const badge = dishCountLabel(itemsCount);

  const metaRows = [
    metaRow(ICONS.home, "Будинок", esc(data.house || "—")),
    data.scheduledFor
      ? metaRow(ICONS.clock, "Подача", formatDateTime(data.scheduledFor))
      : "",
  ].join("");

  const itemsHtml = data.items
    .map((item, index) => itemRow(item, index === data.items.length - 1))
    .join("");

  const commentBlock = data.comment
    ? `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid ${C.border}">
      ${ICONS.chat}
      <span style="${text(TEXT, 500, C.muted)};flex:1">${esc(data.comment)}</span>
    </div>`
    : "";

  return `
  <div style="width:800px;padding:36px;background:${C.bg};font-family:${FONT};box-sizing:border-box">
    <div style="background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden">

      <div style="height:3px;background:linear-gradient(90deg, ${C.accent}, ${C.accentHover})"></div>

      <div style="padding:30px 32px 34px">

        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:13px;min-width:0;flex:1">
            ${ICONS.order}
            <span style="font-size:26px;font-weight:700;color:${C.white};line-height:1">Нове замовлення</span>
          </div>
          <span style="display:inline-flex;align-items:center;justify-content:center;padding:8px 16px;border-radius:999px;font-size:${TEXT}px;font-weight:600;color:${C.accent};line-height:1;background:${C.accentSoft};border:1px solid ${C.accentBorder};white-space:nowrap;flex-shrink:0">${badge}</span>
        </div>

        <div style="display:flex;align-items:center;gap:13px;margin-top:20px">
          ${ICONS.user}
          <span style="${text(TEXT, 600, C.white)}">${esc(data.guestName || "Гість")}</span>
        </div>

        <div style="height:1px;background:${C.border};margin:20px 0"></div>

        ${metaRows}

        <div style="background:${C.panel};border-radius:12px;padding:2px 16px;margin-top:8px">
          ${itemsHtml}
        </div>

        <div style="border-top:1px solid ${C.border};margin-top:22px;padding-top:18px;display:flex;align-items:center;justify-content:space-between;gap:16px">
          <span style="font-size:24px;font-weight:700;color:${C.white};line-height:1">Сума</span>
          <span style="font-size:26px;font-weight:700;color:${C.accent};line-height:1;font-variant-numeric:tabular-nums">${data.total} ₴</span>
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
      scale: 1.5,
      backgroundColor: C.bg,
      logging: false,
      useCORS: true,
    });

    return canvas.toDataURL("image/jpeg", 0.88);
  } catch (error) {
    console.error("[order-card] capture failed", error);
    return null;
  } finally {
    document.body.removeChild(host);
  }
}
