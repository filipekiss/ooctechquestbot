import { config } from "dotenv";
import { existsSync as fileExists } from "fs";
import { resolve } from "path";

export const APP_FOLDER = resolve(__dirname, "../../");
export const DB_FOLDER = resolve(APP_FOLDER, "./db");

console.log(`APP_FOLDER ${APP_FOLDER}`);
console.log(`DB_FOLDER ${DB_FOLDER}`);

const ENV_FILE = resolve(APP_FOLDER, process.env.ENV_FILE ?? ".env");
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

export const AMAZON_AFFILIATE_TAG: string =
  process.env.AMAZON_AFFILIATE_TAG ?? "sup044-20";

export const QUOTES_CHANNEL_ID: string = process.env.QUOTES_CHANNEL_ID ?? "";

export const DASHBOARD_PORT: number = Number(process.env.DASHBOARD_PORT) || 0;

export const BOT_USERNAME: string = process.env.BOT_USERNAME ?? "";

export const DEFAULT_ASSETS_FOLDER =
  process.env.NODE_ENV === "production"
    ? resolve(APP_FOLDER, "./build/assets")
    : resolve(APP_FOLDER, "./assets");

export const DEFAULT_AUDIO_FOLDER = resolve(APP_FOLDER, "./audio");

export const BOT_MESSAGE_TRACKER = "‎";

const defaultDbName = process.env.DB_NAME ?? "ooc.sqlite";
export const SQLITE_DB_PATH = resolve(DB_FOLDER, defaultDbName);
