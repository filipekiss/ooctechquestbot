import { resolve } from "path";
import { createCanvasFromImage, printAtWordWrap } from "../libs/image";

const primaryTextColor = "#001";

export const generateStreakImage = async (
  currentStreak: string,
  longestStreak: string
) => {
  const { canvas, ctx } = await createCanvasFromImage(
    resolve(__dirname, "./frame.png")
  );

  let fontSize = 88;

  ctx.font = `italic ${fontSize}px Helvetica`;
  ctx.fillStyle = primaryTextColor;
  printAtWordWrap(ctx, currentStreak, fontSize, 1050, 275, 1000);
  printAtWordWrap(ctx, longestStreak, fontSize, 1145, 635, 1000);

  return canvas.toBuffer();
};
