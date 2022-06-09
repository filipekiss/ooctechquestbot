import { HydrateFlavor } from "@grammyjs/hydrate";
import { Context } from "grammy";
import {
  ARCHIVE_CHANNEL_ID,
  BOT_TOKEN,
  BOT_USERNAME,
  DEFAULT_ASSETS_FOLDER,
} from "./environment";

function abortIfEmpty(key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${key} cannot be "${value}"`);
  }
  console.log(`Using ${key}: ${value}`);
}

export type OocContext = HydrateFlavor<Context>;

export function setup() {
  abortIfEmpty(`BOT_TOKEN`, BOT_TOKEN);
  abortIfEmpty(`BOT_USERNAME`, BOT_USERNAME);
  abortIfEmpty(`ARCHIVE_CHANNEL_ID`, ARCHIVE_CHANNEL_ID);
  abortIfEmpty(`DEFAULT_ASSETS_FOLDER`, DEFAULT_ASSETS_FOLDER);
}
