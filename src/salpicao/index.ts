import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";

export const salpicao = new Composer<OocContext>();
salpicao.hears(/salpic[aã]o/i, async (ctx) => {
  return await ctx.reply(`-1 sal \n-2 pica`, {
    ...replyToSender(ctx),
  });
});
