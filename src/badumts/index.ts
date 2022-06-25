import { Composer, NextFunction } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { replyToReplyOrToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const badumts = new Composer<OocContext>();

badumts.command(
  ["badumtss", "badumts"],
  withNext(async (context) => {
    const receivedMessage = context.update.message;
    await context.reply("(☞ﾟヮﾟ)☞ ", {
      ...replyToReplyOrToSender(context),
    });
    if (receivedMessage?.reply_to_message) {
      try {
        await receivedMessage.delete();
      } catch {
        console.error("Unable to delete message. Skipping...");
      }
    }
  })
);

export const badumtsModule: BotModule = {
  command: "badumts",
  alias: ["badumtss"],
  shortDescription: "Envia (☞ﾟヮﾟ)☞ ",
  composer: badumts,
};
