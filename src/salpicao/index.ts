import { Composer } from "grammy";
import { OocContext } from "../config";

export const salpicao = new Composer<OocContext>();
salpicao.hears(/salpic[aã]o/i, async (ctx) => {
  const receivedMessage = ctx.message!;
  return await ctx.reply(`-1 sal \n-2 pica`, {
    reply_to_message_id: receivedMessage.message_id,
  });
});
