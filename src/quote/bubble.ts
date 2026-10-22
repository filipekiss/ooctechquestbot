import { createCanvas } from "canvas";

const WIDTH = 800;
const PADDING = 28;
const FONT = "Helvetica, Arial, sans-serif";
const NAME_COLORS = ["#ff885e", "#ffcd6a", "#82e07b", "#6ad5e8", "#7aa8ff", "#d68bff", "#ff7fb2"];

const wrap = (
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number,
) => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
};

const formatTime = (unixSeconds: number) => {
  const date = new Date(unixSeconds * 1000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/** Renders a text-only message as a Telegram dark-theme chat bubble (PNG). */
export function renderQuoteBubble(quote: {
  text: string;
  author_name: string;
  author_id: number;
  message_date: number;
}) {
  const lineHeight = 40;
  const textWidth = WIDTH - PADDING * 4;
  const measure = createCanvas(10, 10).getContext("2d");
  measure.font = `32px ${FONT}`;
  const lines = wrap(measure, quote.text, textWidth);

  const bubbleHeight = PADDING * 2 + 44 + lines.length * lineHeight + 30;
  const canvas = createCanvas(WIDTH, bubbleHeight + PADDING * 2);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0e1621";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#182533";
  ctx.beginPath();
  const [x, y, w, r] = [PADDING, PADDING, WIDTH - PADDING * 2, 24];
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + bubbleHeight, r);
  ctx.arcTo(x + w, y + bubbleHeight, x, y + bubbleHeight, r);
  ctx.arcTo(x, y + bubbleHeight, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  let cursor = y + PADDING + 28;
  ctx.fillStyle = NAME_COLORS[Math.abs(quote.author_id) % NAME_COLORS.length];
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(quote.author_name, x + PADDING, cursor);

  ctx.fillStyle = "#ffffff";
  ctx.font = `32px ${FONT}`;
  cursor += 16;
  for (const line of lines) {
    cursor += lineHeight;
    ctx.fillText(line, x + PADDING, cursor - 6);
  }

  ctx.fillStyle = "#6d7f8f";
  ctx.font = `22px ${FONT}`;
  const time = formatTime(quote.message_date);
  ctx.fillText(time, x + w - PADDING - ctx.measureText(time).width, y + bubbleHeight - 16);

  return canvas.toBuffer("image/png");
}
