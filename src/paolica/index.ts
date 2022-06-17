import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";

export const paolica = new Composer<OocContext>();
paolica.hears(/p[aã]oli[cç]a/i, async (ctx) => {
  return await ctx.reply(`-1 pão \n-2 liça`, {
    ...replyToSender(ctx),
  });
});
