import { Message, ParseMode } from "@grammyjs/types";
import got from "got";
import { Composer } from "grammy";
import { OocContext } from "../config";
import { mdEscape } from "../main";

const wowApi =
  "https://owen-wilson-wow-api.herokuapp.com/wows/random?results=1";

const wowPattern = /(wow|uau|woow|uou)/gim;

export const wow = new Composer<OocContext>();
wow.hears(wowPattern, async (ctx) => {
  const [wow] = await got(wowApi).json<
    [
      {
        audio: string;
        movie: string;
        year: number;
        full_line: string;
        character: string;
        video: {
          "720p": string;
        };
      }
    ]
  >();
  const sendSomething = Math.floor(Math.random() * 10);
  if (sendSomething > 7) return;
  const sendVideo = Math.floor(Math.random() * 10);
  const receivedMessage = ctx.message as Message;
  const replyMessageOptions = {
    reply_to_message_id:
      receivedMessage?.reply_to_message?.message_id ??
      receivedMessage.message_id,
    caption: mdEscape(
      `_${wow.full_line}_ - *${wow.character}*, ${wow.movie}, ${wow.year}`
    ),
    parse_mode: "MarkdownV2" as ParseMode,
  };
  if (sendVideo > 2) {
    await ctx.replyWithChatAction("upload_voice");
    await ctx.replyWithAudio(wow.audio, replyMessageOptions);
    return;
  }
  await ctx.replyWithChatAction("upload_video");
  await ctx.replyWithVideo(wow.video["720p"], replyMessageOptions);
});
