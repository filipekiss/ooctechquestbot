import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const twitter = new Composer<OocContext>();

const twitterRegex = /https:\/\/twitter.com\/([^\/]+)\/status\/([0-9]+)\?.*/m;

twitter.hears(
  twitterRegex,
  withNext(async (ctx) => {
    const [, user, status] = ctx.match as RegExpMatchArray;
    ctx.reply(
      `https://vxtwitter.com/${user}/status/${status}`,
      replyToSender(ctx)
    );
  })
);
