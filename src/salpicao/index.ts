import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const salpicao = new Composer<OocContext>();
salpicao.hears(
  /salpic[aã]o/i,
  withNext(async (ctx) => {
    await ctx.reply(`-1 sal \n-2 pica`, {
      ...replyToSender(ctx),
    });
  })
);
