import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_AUDIO_FOLDER } from "../config/environment";
import { BotModule } from "../main";

export const repetida = new Composer<OocContext>();

const sendAudio = async (ctx: OocContext) => {
  const audioIds = [
    new InputFile(DEFAULT_AUDIO_FOLDER + '/boca-de-leite.aac'),
    new InputFile(DEFAULT_AUDIO_FOLDER + '/repetida.mp3')
  ];

  const receivedMessage = ctx.update.message;
  const isTrigger = receivedMessage?.text?.match(/boca de leite/i);
  if (!receivedMessage?.reply_to_message && !isTrigger) {
    return;
  }
  await ctx.replyWithChatAction("upload_voice");
  const fileId = audioIds[Math.floor(Math.random() * audioIds.length)];
  await ctx.replyWithAudio(fileId, {
    reply_to_message_id: receivedMessage?.reply_to_message?.message_id,
  });
  if (!isTrigger) {
    try {
      await receivedMessage?.delete();
    } catch {
      console.error("Unable to delete message. Skipping...");
    }
  }
};
repetida.hears(/boca de leite/i, sendAudio);
repetida.command("repetida", sendAudio);

export const repetidaModule: BotModule = {
  command: "repetida",
  composer: repetida,
  shortDescription: "Aí não, boca de leite",
};
