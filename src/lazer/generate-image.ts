import { createCanvas, loadImage } from "canvas";
import { resolve } from "path";
import { DEFAULT_ASSETS_FOLDER } from "../config/environment";

export const generateLazerImage = async (from: string, to: string) => {
  console.log({ from, to });

  const canvas = createCanvas(1213, 1280);
  const ctx = canvas.getContext("2d");
  // loads background
  const background = await loadImage(
    resolve(DEFAULT_ASSETS_FOLDER, "./delirios.jpg")
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const fromImage = await loadImage(from);
  const fromCanvas = createCanvas(640, 640);
  const fromCtx = fromCanvas.getContext("2d");
  fromCtx.beginPath();
  fromCtx.arc(300, 300, 280, 0, Math.PI * 2, false);
  fromCtx.stroke();
  fromCtx.clip();
  fromCtx.drawImage(fromImage, 0, 0);

  const toImage = await loadImage(to);
  const toCanvas = createCanvas(640, 640);
  const toCtx = toCanvas.getContext("2d");
  toCtx.beginPath();
  toCtx.arc(300, 300, 280, 0, Math.PI * 2, false);
  toCtx.stroke();
  toCtx.clip();
  toCtx.drawImage(toImage, 0, 0);

  ctx.drawImage(fromCanvas, 450, 330, 300, 300);
  ctx.drawImage(toCanvas, 350, 755, 440, 440);
  const image = canvas.toBuffer();
  return image;
};
