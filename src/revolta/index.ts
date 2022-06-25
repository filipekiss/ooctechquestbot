import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { replyToReplyOrToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const revolta = new Composer<OocContext>();

revolta.command(
  ["revolta", "porra"],
  withNext(async (context: OocContext) => {
    const receivedMessage = context.update.message;
    await context.reply("(╯°□°）╯︵ ┻━┻", {
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

export const revoltaModule: BotModule = {
  command: "revolta",
  alias: ["porra"],
  composer: revolta,
  shortDescription: "Envia (╯°□°）╯︵ ┻━┻",
};
