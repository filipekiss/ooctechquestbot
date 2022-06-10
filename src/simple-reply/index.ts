import { Composer } from "grammy";
import { OocContext } from "../config";

export const simpleReply = new Composer<OocContext>();

const replyMaps = {
  discord: "https://discord.gg/ExvUe8AKnx",
};

Object.entries(replyMaps).forEach(([trigger, reply]) => {
  simpleReply.command(trigger, async (ctx, next) => {
    const receivedMessage = ctx.message;
    if (!receivedMessage) {
      await next();
      return;
    }
    ctx.reply(reply, {
      reply_to_message_id: receivedMessage.message_id,
    });
  });
});
