import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const paolica = new Composer<OocContext>();
paolica.hears(
  /p[aã]oli[cç]a/i,
  withNext(async (ctx) => {
    await ctx.reply(`-1 pão \n-2 liça`, {
      ...replyToSender(ctx),
    });
  })
);
