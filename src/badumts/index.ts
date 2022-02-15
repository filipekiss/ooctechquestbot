import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";

export const badumts = new Composer<OocContext>();

const replyBadumts = badumts.command(
  ["badumtss", "badumts"],
  async (context: OocContext) => {
    const receivedMessage = context.update.message;
    await context.reply("(☞ﾟヮﾟ)☞ ", {
      reply_to_message_id:
        receivedMessage?.reply_to_message?.message_id ??
        context.message!.message_id,
    });
    if (receivedMessage?.reply_to_message) {
      try {
        await receivedMessage.delete();
      } catch {
        console.error("Unable to delete message. Skipping...");
      }
    }
  }
);

export const badumtsModule: BotModule = {
  command: "badumts",
  alias: ["badumtss"],
  shortDescription: "Envia (☞ﾟヮﾟ)☞ ",
  composer: badumts,
};
