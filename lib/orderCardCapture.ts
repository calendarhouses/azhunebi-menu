// Renders a premium receipt card to JPEG (base64) via html2canvas.
// Layout: CSS Grid (1fr auto) per row + fixed 24×24 icon column.

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
const LH = "1.3";

const C = {
  bg: "#221f1c",
  card: "#2f2b27",
  white: "#fafaf9",
  muted: "#a8a29e",
  accent: "#c4a574",
  accentHover: "#d6bc94",
  accentSoft: "rgba(196,165,116,0.14)",
  accentBorder: "rgba(196,165,116,0.28)",
};

const GRID_ROW = "display:grid;grid-template-columns:1fr auto;align-items:center";
const RIGHT = "font-weight:700;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums";
const DIVIDER = "margin:20px 0;border-bottom:1px solid rgba(255,255,255,0.1)";

const ICON_PATHS = {
  order:
    '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h4"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"/>',
  home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l2.5 1.5"/>',
  chat: '<path d="M7 18l-3 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9.5L7 18z"/>',
};

function iconBox(paths: string): string {
  return `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${C.accent}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0">${paths}</svg></span>`;
}

function leftCell(iconPaths: string, label: string, labelColor = C.muted): string {
  return `<span style="display:flex;align-items:center;gap:8px;min-width:0">${iconBox(iconPaths)}<span style="font-size:${TEXT}px;font-weight:500;color:${labelColor};line-height:${LH}">${label}</span></span>`;
}

function gridRow(
  leftHtml: string,
  rightHtml: string,
  gap: number,
  rowStyle = ""
): string {
  return `<div style="${GRID_ROW};gap:${gap}px;${rowStyle}">${leftHtml}${rightHtml}</div>`;
}

function rightCell(value: string, color = C.white, size = TEXT): string {
  return `<span style="font-size:${size}px;color:${color};${RIGHT};line-height:${LH}">${value}</span>`;
}

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

function metaRow(
  iconKey: keyof typeof ICON_PATHS,
  label: string,
  value: string
): string {
  return gridRow(
    leftCell(ICON_PATHS[iconKey], label),
    rightCell(value),
    20,
    "padding:8px 0"
  );
}

function itemRow(item: OrderCardItem, isLast: boolean): string {
  const lineTotal = item.price * item.quantity;
  const border = isLast
    ? ""
    : "border-bottom:1px solid rgba(255,255,255,0.08);";

  const left = `<span style="font-size:${TEXT}px;font-weight:500;color:${C.white};line-height:${LH};min-width:0">${esc(item.name)} <span style="opacity:0.5">×${item.quantity}</span></span>`;

  return gridRow(left, rightCell(`${lineTotal} ₴`), 16, `padding:12px 0;${border}`);
}

function buildCardHtml(data: OrderCardData): string {
  const itemsCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
  const badge = dishCountLabel(itemsCount);

  const metaRows = [
    metaRow("home", "Будинок", esc(data.house || "—")),
    data.scheduledFor
      ? metaRow("clock", "Подача", formatDateTime(data.scheduledFor))
      : "",
  ].join("");

  const itemsHtml = data.items
    .map((item, index) => itemRow(item, index === data.items.length - 1))
    .join("");

  const commentBlock = data.comment
    ? `
    <div style="${DIVIDER}"></div>
    <div style="display:flex;align-items:center;gap:8px">
      ${iconBox(ICON_PATHS.chat)}
      <span style="font-size:${TEXT}px;font-weight:500;color:${C.muted};line-height:${LH};flex:1;min-width:0">${esc(data.comment)}</span>
    </div>`
    : "";

  return `
  <div style="width:800px;padding:36px;background:${C.bg};font-family:${FONT};box-sizing:border-box">
    <div style="background:${C.card};border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;box-sizing:border-box">

      <div style="height:3px;background:linear-gradient(90deg, ${C.accent}, ${C.accentHover})"></div>

      <div style="padding:30px 32px 34px;font-family:${FONT};line-height:${LH};box-sizing:border-box">

        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="display:flex;align-items:center;gap:10px">
            ${iconBox(ICON_PATHS.order)}
            <span style="font-size:26px;font-weight:700;color:${C.white};line-height:${LH}">Нове замовлення</span>
          </span>
          <span style="padding:6px 14px;border-radius:20px;font-size:${TEXT}px;font-weight:600;color:${C.accent};background:${C.accentSoft};border:1px solid ${C.accentBorder};white-space:nowrap;line-height:${LH}">${badge}</span>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin-top:20px">
          ${iconBox(ICON_PATHS.user)}
          <span style="font-size:${TEXT}px;font-weight:600;color:${C.white};line-height:${LH}">${esc(data.guestName || "Гість")}</span>
        </div>

        <div style="${DIVIDER}"></div>

        ${metaRows}

        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:4px 16px;margin-bottom:24px;box-sizing:border-box">
          ${itemsHtml}
        </div>

        <div style="${DIVIDER}"></div>

        <div style="${GRID_ROW};gap:16px;margin-top:16px">
          <span style="font-size:24px;font-weight:800;color:${C.white};line-height:${LH}">Сума</span>
          <span style="font-size:22px;font-weight:900;color:${C.accent};${RIGHT};line-height:${LH}">${data.total} ₴</span>
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
