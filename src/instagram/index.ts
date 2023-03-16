import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const instagram = new Composer<OocContext>();

const instagramRegex = /https:\/\/(?:www.)?instagram.com\/(.+)/m;

instagram.hears(
  instagramRegex,
  withNext(async (ctx) => {
    const [, status] = ctx.match as RegExpMatchArray;
    ctx.reply(
      `https://ddinstagram.com/${status}`,
      replyToSender(ctx)
    );
  })
);
