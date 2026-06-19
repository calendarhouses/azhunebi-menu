// Renders a premium receipt card to JPEG (base64) via html2canvas.

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

/** Wide enough for long dish names; still taller than wide after Telegram resize. */
const CARD_WIDTH = 680;
const PADDING_SHELL = 28;
const PADDING_INNER = 28;
const PRICE_COL_WIDTH = 132;

const TEXT = 44;
const TEXT_SM = 38;
const TITLE = 52;
const SUM_LABEL = 48;
const SUM_VALUE = 52;
const LH = "1.42";

const C = {
  bg: "#221f1c",
  card: "#2f2b27",
  white: "#fafaf9",
  muted: "#a8a29e",
  accent: "#c4a574",
  accentHover: "#d6bc94",
};

const TWO_COL = `display:grid;grid-template-columns:minmax(0,1fr) ${PRICE_COL_WIDTH}px;align-items:start;column-gap:20px`;
const RIGHT =
  "font-weight:700;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0";

function sectionDivider(): string {
  return `<div style="height:1px;background:rgba(255,255,255,0.1);margin:16px 0;flex-shrink:0"></div>`;
}

function twoColRow(
  leftHtml: string,
  rightHtml: string,
  rowStyle = ""
): string {
  return `<div style="${TWO_COL};${rowStyle}">${leftHtml}${rightHtml}</div>`;
}

function rightCell(value: string, color = C.white, size = TEXT): string {
  return `<span style="font-size:${size}px;color:${color};${RIGHT}">${value}</span>`;
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

function metaRow(label: string, value: string): string {
  const left = `<span style="font-size:${TEXT_SM}px;font-weight:500;color:${C.muted};line-height:${LH};padding-top:4px">${label}</span>`;
  const right = `<span style="font-size:${TEXT}px;font-weight:600;color:${C.white};${RIGHT};line-height:${LH}">${value}</span>`;
  return twoColRow(left, right, "padding:8px 0;box-sizing:border-box");
}

function itemRow(item: OrderCardItem, isLast: boolean): string {
  const lineTotal = item.price * item.quantity;
  const border = isLast
    ? ""
    : "border-bottom:1px solid rgba(255,255,255,0.08);";

  const left = `<div style="min-width:0;word-wrap:break-word;overflow-wrap:anywhere;line-height:${LH}">
    <span style="font-size:${TEXT}px;font-weight:500;color:${C.white}">${esc(item.name)}</span>
    <span style="font-size:${TEXT}px;font-weight:500;color:${C.white};opacity:0.55"> ×${item.quantity}</span>
  </div>`;

  return twoColRow(
    left,
    rightCell(`${lineTotal} ₴`),
    `padding:12px 0;box-sizing:border-box;${border}`
  );
}

function buildCardHtml(data: OrderCardData): string {
  const itemsCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
  const badge = dishCountLabel(itemsCount);

  const metaRows = [
    metaRow(
      (data.house || "").includes("За столиком") ? "Локація" : "Будиночок",
      esc(data.house || "—")
    ),
    data.scheduledFor
      ? metaRow("Подача", formatDateTime(data.scheduledFor))
      : "",
  ].join("");

  const itemsHtml = data.items
    .map((item, index) => itemRow(item, index === data.items.length - 1))
    .join("");

  const commentBlock = data.comment
    ? `
    ${sectionDivider()}
    <p style="margin:0;font-size:${TEXT_SM}px;font-weight:500;color:${C.muted};line-height:${LH};word-wrap:break-word">${esc(data.comment)}</p>`
    : "";

  return `
  <div style="width:${CARD_WIDTH}px;padding:${PADDING_SHELL}px;background:${C.bg};font-family:${FONT};box-sizing:border-box">
    <div style="background:${C.card};border:1px solid rgba(255,255,255,0.1);border-radius:18px;box-sizing:border-box">

      <div style="height:3px;background:linear-gradient(90deg, ${C.accent}, ${C.accentHover});border-radius:18px 18px 0 0"></div>

      <div style="padding:${PADDING_INNER}px;font-family:${FONT};box-sizing:border-box;display:flex;flex-direction:column">

        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div style="min-width:0;flex:1">
            <div style="font-size:${TITLE}px;font-weight:700;color:${C.white};line-height:1.35">Нове замовлення</div>
            <div style="margin-top:10px;font-size:${TEXT}px;font-weight:600;color:${C.white};line-height:${LH}">${esc(data.guestName || "Гість")}</div>
          </div>
          <span style="font-size:${TEXT_SM}px;font-weight:600;color:${C.accent};white-space:nowrap;flex-shrink:0;line-height:${LH};padding-top:6px">${badge}</span>
        </div>

        ${sectionDivider()}

        <div>${metaRows}</div>

        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:4px 16px;margin-top:12px;margin-bottom:16px;box-sizing:border-box">
          ${itemsHtml}
        </div>

        ${sectionDivider()}

        <div style="${TWO_COL};align-items:center">
          <span style="font-size:${SUM_LABEL}px;font-weight:800;color:${C.white};line-height:${LH}">Сума</span>
          <span style="font-size:${SUM_VALUE}px;font-weight:900;color:${C.accent};${RIGHT}">${data.total} ₴</span>
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
  host.style.width = `${CARD_WIDTH}px`;
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  host.innerHTML = buildCardHtml(data);

  document.body.appendChild(host);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const target = host.firstElementChild as HTMLElement;

    const canvas = await html2canvas(target, {
      width: CARD_WIDTH,
      scale: 2,
      backgroundColor: C.bg,
      logging: false,
      useCORS: true,
    });

    return canvas.toDataURL("image/jpeg", 0.88);
  } catch (error) {
    console.error("[order-card] capture failed", error);
    return null;
  } finally {
    host.remove();
  }
}
