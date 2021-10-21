import { config } from "dotenv";
import { existsSync as fileExists } from "fs";
import { resolve } from "path";

const ENV_FILE = resolve(__dirname, "../.env");
console.log(`Looking for ${ENV_FILE}`);
if (fileExists(ENV_FILE)) {
  console.log(`Using ENV_FILE: ${ENV_FILE}`);
  config({
    path: ENV_FILE,
  });
} else {
  console.log(`ENV_FILE not found. Continuing...`);
}

export const BOT_TOKEN: string = process.env.BOT_TOKEN ?? "";

export const ARCHIVE_CHANNEL_ID: string = process.env.ARCHIVE_CHANNEL_ID ?? "";

export const BOT_USERNAME: string = process.env.BOT_USERNAME ?? "";

export const ASSETS_FOLDER: string = process.env.ASSETS_FOLDER ?? "./assets";
