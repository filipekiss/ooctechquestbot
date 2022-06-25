import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_AUDIO_FOLDER } from "../config/environment";
import { BotModule } from "../main";
import { replyToReply } from "../utils/message";
import { withNext } from "../utils/middleware";

export const repetida = new Composer<OocContext>();

const sendAudio = async (ctx: OocContext) => {
  const audioIds = [
    new InputFile(DEFAULT_AUDIO_FOLDER + "/boca-de-leite.aac"),
    new InputFile(DEFAULT_AUDIO_FOLDER + "/repetida.mp3"),
  ];

  const receivedMessage = ctx.update.message;
  const isTrigger = receivedMessage?.text?.match(/boca de leite/i);
  if (!receivedMessage?.reply_to_message && !isTrigger) {
    return;
  }
  await ctx.replyWithChatAction("upload_voice");
  const fileId = audioIds[Math.floor(Math.random() * audioIds.length)];
  await ctx.replyWithAudio(fileId, {
    ...replyToReply(ctx),
  });
  if (!isTrigger) {
    try {
      await receivedMessage?.delete();
    } catch {
      console.error("Unable to delete message. Skipping...");
    }
  }
};
repetida.hears(/boca de leite/i, withNext(sendAudio));
repetida.command("repetida", withNext(sendAudio));

export const repetidaModule: BotModule = {
  command: "repetida",
  composer: repetida,
  shortDescription: "Aí não, boca de leite",
};
