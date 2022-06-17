import { Composer } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";

export const simpleReply = new Composer<OocContext>();

const replyMaps = {
  discord: "https://discord.gg/ExvUe8AKnx",
};

Object.entries(replyMaps).forEach(([trigger, reply]) => {
  simpleReply.command(trigger, async (ctx, next) => {
    ctx.reply(reply, {
      ...replyToSender(ctx),
    });
    await next();
  });
});
