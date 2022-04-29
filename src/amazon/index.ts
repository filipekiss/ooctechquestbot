import { Composer } from "grammy";
import { OocContext } from "../config";

const amazonPattern =
  /(https:\/\/(?:www.)?amazon.com.br)\/([^\/]*)\/([^\/]*)\/([^\/]*)\//gm;

const amazonTransformer = (matches: RegExpMatchArray) => {
  const [, amazonUrl, productDescription, code, id] = matches;
  const affiliate = "?tag=mq08-20";
  return `${amazonUrl}/${productDescription}/${code}/${id}${affiliate}`;
};

export const amazon = new Composer<OocContext>();
amazon.hears(amazonPattern, async (ctx) => {
  const receivedMessage = ctx.message!;
  const newLink = amazonTransformer(ctx.match as RegExpMatchArray);
  return await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
    reply_to_message_id: receivedMessage.message_id,
    parse_mode: "MarkdownV2",
  });
});
