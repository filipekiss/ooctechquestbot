import { Composer } from "grammy";
import { OocContext } from "../config";

export const paolica = new Composer<OocContext>();
paolica.hears(/p[aã]oli[cç]a/i, async (ctx) => {
  const receivedMessage = ctx.message!;
  return await ctx.reply(`-1 pão \n-2 liça`, {
    reply_to_message_id: receivedMessage.message_id,
  });
});
