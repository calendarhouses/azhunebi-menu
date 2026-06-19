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

/** Uniform 3× scale — same layout as the original card, everything proportionally larger. */
const SCALE = 3;
const s = (px: number) => px * SCALE;

const CARD_WIDTH = s(800);
const TEXT = s(21);
const TITLE = s(28);
const SUM_LABEL = s(26);
const SUM_VALUE = s(26);
const LH = "1.3";

const C = {
  bg: "#221f1c",
  card: "#2f2b27",
  white: "#fafaf9",
  muted: "#a8a29e",
  accent: "#c4a574",
  accentHover: "#d6bc94",
};

const GRID_ROW = "display:grid;grid-template-columns:1fr auto;align-items:center";
const RIGHT = "font-weight:700;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums";

function sectionDivider(): string {
  return `<div style="height:1px;background:rgba(255,255,255,0.1);margin:${s(20)}px 0;flex-shrink:0"></div>`;
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
  const left = `<span style="font-size:${TEXT}px;font-weight:500;color:${C.muted}">${label}</span>`;
  return gridRow(
    left,
    rightCell(value),
    s(20),
    `padding:${s(10)}px 0;box-sizing:border-box`
  );
}

function itemRow(item: OrderCardItem, isLast: boolean): string {
  const lineTotal = item.price * item.quantity;
  const border = isLast
    ? ""
    : "border-bottom:1px solid rgba(255,255,255,0.08);";

  const left = `<span style="font-size:${TEXT}px;font-weight:500;color:${C.white};min-width:0">${esc(item.name)} <span style="opacity:0.5">×${item.quantity}</span></span>`;

  return gridRow(
    left,
    rightCell(`${lineTotal} ₴`),
    s(16),
    `padding:${s(12)}px 0;${border}`
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
    <span style="font-size:${TEXT}px;font-weight:500;color:${C.muted}">${esc(data.comment)}</span>`
    : "";

  return `
  <div style="width:${CARD_WIDTH}px;padding:${s(36)}px;background:${C.bg};font-family:${FONT};box-sizing:border-box">
    <div style="background:${C.card};border:1px solid rgba(255,255,255,0.1);border-radius:${s(20)}px;overflow:hidden;box-sizing:border-box">

      <div style="height:${s(3)}px;background:linear-gradient(90deg, ${C.accent}, ${C.accentHover})"></div>

      <div style="padding:${s(30)}px ${s(32)}px ${s(34)}px;font-family:${FONT};line-height:${LH};box-sizing:border-box;display:flex;flex-direction:column">

        <div style="display:flex;justify-content:space-between;align-items:center;gap:${s(16)}px">
          <span style="font-size:${TITLE}px;font-weight:700;color:${C.white}">Нове замовлення</span>
          <span style="font-size:${TEXT}px;font-weight:600;color:${C.accent};white-space:nowrap;flex-shrink:0">${badge}</span>
        </div>

        <div style="margin-top:${s(20)}px">
          <span style="font-size:${TEXT}px;font-weight:600;color:${C.white}">${esc(data.guestName || "Гість")}</span>
        </div>

        ${sectionDivider()}

        <div style="display:block;height:auto;margin-bottom:${s(4)}px">
          ${metaRows}
        </div>

        <div style="background:rgba(255,255,255,0.06);border-radius:${s(12)}px;padding:${s(4)}px ${s(16)}px;margin-top:${s(16)}px;margin-bottom:${s(24)}px;box-sizing:border-box;height:auto">
          ${itemsHtml}
        </div>

        ${sectionDivider()}

        <div style="${GRID_ROW};gap:${s(16)}px">
          <span style="font-size:${SUM_LABEL}px;font-weight:800;color:${C.white}">Сума</span>
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
