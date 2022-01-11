import * as fs from "fs";
import { basename, resolve } from "path";
import {
  CUSTOM_ASSETS_FOLDER,
  DEFAULT_ASSETS_FOLDER,
} from "../config/environment";
import { createCanvasFromImage, printAtWordWrap } from "../libs/image";

const primaryTextColor = "#001";

interface QuoteDetails {
  text: string;
  author: string;
  query?: string;
}

function resolvePathTo(path: string) {
  return (to: string) => {
    return resolve(path, to);
  };
}

export function listAvailableTemplates(folders: string[]) {
  return [...folders]
    .map((folder) => {
      try {
        return fs
          .readdirSync(folder)
          .map(resolvePathTo(folder))
          .filter((file) => file.endsWith(".jpg"))
          .map((file) => {
            return basename(file, ".jpg");
          });
      } catch {
        return null;
      }
    })
    .filter((x) => x)
    .flat();
}

function getQuoteTemplate(query?: string) {
  let templateFiles = fs
    .readdirSync(DEFAULT_ASSETS_FOLDER)
    .map(resolvePathTo(DEFAULT_ASSETS_FOLDER));
  try {
    const filesInFolder = fs
      .readdirSync(CUSTOM_ASSETS_FOLDER)
      .map(resolvePathTo(CUSTOM_ASSETS_FOLDER));
    templateFiles = [...templateFiles, ...filesInFolder];
  } finally {
    console.log({ templateFiles });

    if (query) {
      const eligibleFiles = templateFiles.filter((template) =>
        template.includes(query)
      );
      console.log({ eligibleFiles });
      const quoteTemplate =
        eligibleFiles[Math.floor(Math.random() * eligibleFiles.length)];
      console.log(`Random image file selected: ${quoteTemplate}`);
      return quoteTemplate;
    }

    const quoteTemplate =
      templateFiles[Math.floor(Math.random() * templateFiles.length)];
    console.log(`Random image file selected: ${quoteTemplate}`);

    return quoteTemplate;
  }
}

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
