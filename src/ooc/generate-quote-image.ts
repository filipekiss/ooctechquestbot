import * as fs from "fs";
import { basename, resolve } from "path";
import {
  CUSTOM_ASSETS_FOLDER,
  DEFAULT_ASSETS_FOLDER,
} from "../config/environment";
import {
  createCanvasFromImage,
  getTextSize,
  printAtWordWrap,
} from "../libs/image";

const primaryTextColor = "#FFFFFF";
const secondaryTextColor = "#9D9B89";

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

export const generateQuoteImage = async (quote: QuoteDetails) => {
  const quoteTemplateLocation = getQuoteTemplate(quote.query);
  if (!quoteTemplateLocation) {
    return false;
  }
  const quoteText = `‟${quote.text}”`;

  const { canvas, ctx } = await createCanvasFromImage(quoteTemplateLocation);

  // add user friend-code
  ctx.font = `italic 96px Helvetica`;
  ctx.fillStyle = primaryTextColor;
  printAtWordWrap(ctx, quoteText, 96, 100, 200, 1420);

  ctx.font = `italic 48px Helvetica`;
  const { width: textSize } = getTextSize(quote.author, 48);
  ctx.fillText(quote.author, 1500 - textSize, 600);

  return canvas.toBuffer();
};
