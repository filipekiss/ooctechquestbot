import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";

export const createCanvasFromImage = async (templateLocation: string) => {
  const canvas = createCanvas(1620, 1080);
  const ctx = canvas.getContext("2d");
  // loads background
  const background = await loadImage(templateLocation);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  return {
    canvas,
    ctx,
  };
};

const calculateFontSize = (
  text: string,
  maxWidth = 392,
  initialFontSize = 16
) => {
  const canvas = createCanvas(maxWidth, 150);
  const ctx = canvas.getContext("2d");
  // Declare a base size of the font
  let fontSize = initialFontSize;

  do {
    // Assign the font to the context and decrement it so it can be measured again
    ctx.font = `${(fontSize -= 1)}px Helvetica`;
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (ctx.measureText(text).width > canvas.width);

  // Return the result to use in the actual canvas
  return `${fontSize}px Helvetica`;
};

export const getTextSize = (text: string, fontSize = 16) => {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontSize}px Helvetica`;
  return ctx.measureText(text);
};

export function printAtWordWrap(
  context: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  x: number,
  y: number,
  fitWidth: number
) {
  const metrics = getTextSize(text, fontSize);
  const lineHeight =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  if (fitWidth <= 0) {
    context.fillText(text, x, y);
    return;
  }
  var words = text.split(" ");
  var currentLine = 0;
  var idx = 1;
  while (words.length > 0 && idx <= words.length) {
    var str = words.slice(0, idx).join(" ");
    var w = context.measureText(str).width;
    if (w > fitWidth) {
      if (idx == 1) {
        idx = 2;
      }
      context.fillText(
        words.slice(0, idx - 1).join(" "),
        x,
        y + lineHeight * currentLine
      );
      currentLine++;
      words = words.splice(idx - 1);
      idx = 1;
    } else {
      idx++;
    }
  }
  if (idx > 0)
    context.fillText(words.join(" "), x, y + lineHeight * currentLine);
}
