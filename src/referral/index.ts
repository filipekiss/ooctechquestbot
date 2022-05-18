import { Composer, InlineKeyboard } from "grammy";
import { OocContext } from "../config";

type ReferralConfig = {
  store: string;
  buttonText: string;
  pattern: RegExp;
  transform: (matches: RegExpMatchArray) => string;
};
const referralSites: ReferralConfig[] = [
  {
    store: "amazon",
    buttonText: "Ver na Amazon",
    pattern: /(https:\/\/(?:www.)?amazon.com.br)\/(?:[^\/]+\/)?dp\/([^\/?]+)/gm,
    transform: (matches) => {
      const [, amazonUrl, id] = matches;
      const affiliate = "?tag=mq08-20";
      return `${amazonUrl}/dp/${id}${affiliate}`;
    },
  },
  {
    store: "americanas",
    buttonText: "Ver na Americanas",
    pattern: /(https:\/\/(?:www.)?americanas.com.br\/.*)/gm,
    transform: (matches) => {
      const [, productUrl] = matches;
      const affiliate =
        "https://www.awin1.com/cread.php?awinmid=22193&awinaffid=898295&ued=";
      return `${affiliate}${encodeURIComponent(productUrl)}`;
    },
  },
  {
    store: "aliexpress",
    buttonText: "Ver no AliExpress",

    pattern: /(https:\/\/(?:www.)?aliexpress.com\/item\/.*.html)/gm,

    transform: (matches) => {
      const [, productUrl] = matches;
      const affiliate =
        "?aff_fcid=d159f461d2654ec6933cf7ba1ae26166-1651244456726-04243-_A4JBRX";
      return `${productUrl}${affiliate}`;
    },
  },
  {
    store: "magazineluiza",
    buttonText: "Ver no Magazine",

    pattern: /(http(?:s)?:\/\/(?:www.)?magazinevoce.com.br)\/([^\/]+)\/(.*)/gm,

    transform: (matches) => {
      const [, magazineUrl, , productDetails] = matches;
      const affiliate = "magazinepromosupoficial";
      return `${magazineUrl}/${affiliate}/${productDetails}`;
    },
  },
];

export const referral = new Composer<OocContext>();
referral.hears(
  referralSites.map((ref) => ref.pattern),
  async (ctx, next) => {
    const receivedMessage = ctx.message!;
    const store = referralSites.find((config) => {
      return receivedMessage.text!.match(config.pattern);
    });
    if (!store) {
      await next();
      return;
    }
    const newLink = store.transform(ctx.match as RegExpMatchArray);
    const linkButton = new InlineKeyboard().url(store.buttonText, newLink);
    await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
      reply_to_message_id: receivedMessage.message_id,
      parse_mode: "MarkdownV2",
      reply_markup: linkButton,
    });
    await next();
    return;
  }
);
