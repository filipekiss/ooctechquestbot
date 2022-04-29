import { Composer } from "grammy";
import { OocContext } from "../config";

const aliPattern = /(https:\/\/(?:www.)?aliexpress.com\/item\/.*.html)/gm;

const aliTransformer = (matches: RegExpMatchArray) => {
  const [, productUrl] = matches;
  const affiliate =
    "?aff_fcid=d159f461d2654ec6933cf7ba1ae26166-1651244456726-04243-_A4JBRX";
  return `${productUrl}${affiliate}`;
};

export const ali = new Composer<OocContext>();
ali.hears(aliPattern, async (ctx) => {
  const receivedMessage = ctx.message!;
  const newLink = aliTransformer(ctx.match as RegExpMatchArray);
  return await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
    reply_to_message_id: receivedMessage.message_id,
    parse_mode: "MarkdownV2",
  });
});
