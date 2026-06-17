// Renders a premium receipt card to a JPEG (base64) using html2canvas.
// The card is drawn in a hidden, fixed, off-screen node with fully inline
// styles (hex/rgb only) so html2canvas never trips over Tailwind oklch vars.

export type OrderCardItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderCardData = {
  guestName: string;
  guestUsername?: string | null;
  house: string;
  items: OrderCardItem[];
  total: number;
  scheduledFor?: string | null;
  comment?: string | null;
};

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif";

const COLORS = {
  gradientFrom: "#2b2620",
  gradientTo: "#14110d",
  card: "#faf6ef",
  ink: "#2a2420",
  muted: "#9a9087",
  accent: "#b8965a",
  accentSoft: "#f1e9da",
  line: "#ece4d6",
  panel: "#f6f0e6",
};

function svg(path: string): string {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${COLORS.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;display:block">${path}</svg>`;
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
  dot: svg('<circle cx="12" cy="12" r="4" fill="' + COLORS.accent + '"/>'),
  card: svg(
    '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'
  ),
  chat: svg(
    '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/>'
  ),
};

function escapeHtml(value: string): string {
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

function row(icon: string, label: string, value: string): string {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0">
      <div style="display:flex;align-items:center;gap:12px">
        ${icon}
        <span style="font-size:22px;color:${COLORS.muted}">${label}</span>
      </div>
      <span style="font-size:23px;font-weight:700;color:${COLORS.ink};text-align:right">${value}</span>
    </div>`;
}

function itemRow(item: OrderCardItem): string {
  const lineTotal = item.price * item.quantity;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 0">
      <div style="display:flex;align-items:center;gap:12px;min-width:0">
        ${ICONS.dot}
        <span style="font-size:22px;color:${COLORS.ink};font-weight:600">${escapeHtml(item.name)}<span style="color:${COLORS.muted};font-weight:500"> ×${item.quantity}</span></span>
      </div>
      <span style="font-size:22px;font-weight:700;color:${COLORS.ink};white-space:nowrap">${lineTotal} ₴</span>
    </div>`;
}

function buildCardHtml(data: OrderCardData): string {
  const itemsCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

  const detailRows = [
    row(ICONS.home, "Будинок:", escapeHtml(data.house || "—")),
    data.scheduledFor
      ? row(ICONS.clock, "Подача:", formatDateTime(data.scheduledFor))
      : "",
  ].join("");

  const itemsHtml = data.items.map(itemRow).join("");

  const commentHtml = data.comment
    ? `<div style="display:flex;align-items:flex-start;gap:12px;margin-top:18px">
        ${ICONS.chat}
        <span style="font-size:20px;color:${COLORS.muted};line-height:1.4">${escapeHtml(data.comment)}</span>
      </div>`
    : "";

  return `
  <div style="width:800px;padding:48px;background:linear-gradient(135deg, ${COLORS.gradientFrom}, ${COLORS.gradientTo});font-family:${FONT_STACK};box-sizing:border-box">
    <div style="background:${COLORS.card};border-radius:32px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.35)">
      <div style="height:8px;background:linear-gradient(90deg, ${COLORS.accent}, #e0c692)"></div>
      <div style="padding:44px 48px 48px">

        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:14px">
            ${ICONS.bell}
            <span style="font-size:34px;font-weight:800;color:${COLORS.ink};letter-spacing:-0.5px">Нове замовлення</span>
          </div>
          <span style="font-size:20px;font-weight:700;color:${COLORS.accent};background:${COLORS.accentSoft};padding:10px 18px;border-radius:999px;white-space:nowrap">${itemsCount} страв</span>
        </div>

        <div style="margin-top:24px;display:flex;align-items:center;gap:14px">
          ${ICONS.user}
          <div style="display:flex;flex-direction:column">
            <span style="font-size:30px;font-weight:800;color:${COLORS.ink};line-height:1.1">${escapeHtml(data.guestName || "Гість")}</span>
            ${data.guestUsername ? `<span style="font-size:20px;color:${COLORS.muted};margin-top:2px">@${escapeHtml(data.guestUsername)}</span>` : ""}
          </div>
        </div>

        <div style="height:1px;background:${COLORS.line};margin:26px 0"></div>

        ${detailRows}

        <div style="background:${COLORS.panel};border:1px solid ${COLORS.line};border-radius:22px;padding:20px 24px;margin-top:20px">
          ${itemsHtml}
        </div>

        <div style="height:1px;background:${COLORS.line};margin:26px 0"></div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
          <div style="display:flex;align-items:center;gap:12px">
            ${ICONS.card}
            <span style="font-size:26px;font-weight:700;color:${COLORS.ink}">Сума</span>
          </div>
          <span style="font-size:36px;font-weight:900;color:${COLORS.accent};letter-spacing:-0.5px">${data.total} ₴</span>
        </div>

        ${commentHtml}
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
      backgroundColor: null,
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
