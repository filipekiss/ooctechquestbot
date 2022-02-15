import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";

export const revolta = new Composer<OocContext>();

const replyRevolta = revolta.command(
  ["revolta", "porra"],
  async (context: OocContext) => {
    const receivedMessage = context.update.message;
    await context.reply("(╯°□°）╯︵ ┻━┻", {
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

export const revoltaModule: BotModule = {
  command: "revolta",
  alias: ["porra"],
  composer: revolta,
  shortDescription: "Envia (╯°□°）╯︵ ┻━┻",
};
