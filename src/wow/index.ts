import { Message, ParseMode } from "@grammyjs/types";
import got from "got";
import { Composer } from "grammy";
import { OocContext } from "../config";
import { mdEscape } from "../main";
import { replyToReplyOrToSender } from "../utils/message";

const wowApi =
  "https://owen-wilson-wow-api.herokuapp.com/wows/random?results=1";

const wowPattern = /(wow|uau|woow|uou)/gim;

export const wow = new Composer<OocContext>();
wow.hears(wowPattern, async (ctx) => {
  const [wow] = await got(wowApi).json<
    [
      {
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
  if (sendSomething > 1) return;
  const replyMessageOptions = {
    ...replyToReplyOrToSender(ctx),
    caption: mdEscape(
      `_${wow.full_line}_ - *${wow.character}*, ${wow.movie}, ${wow.year}`
    ),
    parse_mode: "MarkdownV2" as ParseMode,
  };
  await ctx.replyWithChatAction("upload_video");
  await ctx.replyWithVideo(wow.video["720p"], replyMessageOptions);
});
