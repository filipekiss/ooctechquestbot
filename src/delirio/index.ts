import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_ASSETS_FOLDER } from "../config/environment";
import { BotModule } from "../main";

export const delirio = new Composer<OocContext>();

delirio.command(["delirio", "delirios"], async (context: OocContext) => {
  const receivedMessage = context.update.message;
  await context.replyWithPhoto(
    new InputFile(`${DEFAULT_ASSETS_FOLDER}/delirios.jpg`),
    {
      reply_to_message_id:
        receivedMessage?.reply_to_message?.message_id ??
        context.message!.message_id,
    }
  );
  if (receivedMessage?.reply_to_message) {
    try {
      await receivedMessage.delete();
    } catch {
      console.error("Unable to delete message. Skipping...");
    }
  }
});

export const deliriosModule: BotModule = {
  command: "delirio",
  alias: ["delirios"],
  shortDescription: "Compra, pô. É o seu lazer.",
  composer: delirio,
};
