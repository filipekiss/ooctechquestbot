import got from "got/dist/source";
import { Composer, InlineKeyboard } from "grammy";
import { OocContext } from "../config";
import { replyToSender } from "../utils/message";

type ReferralConfig = {
  store: string;
  buttonText: string;
  pattern: RegExp;
  transform: (
    matches: RegExpMatchArray
  ) => string | Promise<string | null> | null;
};
const referralSites: ReferralConfig[] = [
  {
    store: "amazon",
    buttonText: "Ver na Amazon",
    pattern:
      /(https:\/\/(?:www.)?amazon.com.br)\/(?:[^\/]+\/)?(?:[^\/]+)\/([^\/?]+)/gm,
    transform: (matches) => {
      const [, amazonUrl, id] = matches;
      const affiliate = "?tag=mq08-20";
      return `${amazonUrl}/dp/${id}${affiliate}`;
    },
  },
  {
    buttonText: "Ver na Amazon",
    store: "amznto",
    pattern: /(https:\/\/(?:[a-z0-9].*\.)?amzn.to\/.*)(?:\?.*)?/gm,
    transform: async (matches) => {
      const [shortUrl] = matches;
      const { redirectUrls } = await got.get(shortUrl);
      const amazon = referralSites.find((config) => config.store === "amazon");
      const [productUrl] = redirectUrls;
      const expandedMatches = amazon?.pattern.exec(productUrl);
      if (expandedMatches) {
        const newUrl = amazon?.transform(expandedMatches);
        return newUrl ? newUrl : null;
      }
      return null;
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

    pattern:
      /(https:\/\/(?:[a-z0-9].*\.)?aliexpress.com\/item\/.*.html)(?:.*)/gm,

    transform: (matches) => {
      const [, productUrl] = matches;
      const affiliate =
        "?aff_fcid=d159f461d2654ec6933cf7ba1ae26166-1651244456726-04243-_A4JBRX";
      return `${productUrl}${affiliate}`;
    },
  },
  {
    buttonText: "Ver no AliExpress",
    store: "alishort",
    pattern: /(https:\/\/(?:[a-z0-9].*\.)?aliexpress.com\/.*)(?:\?.*)?/gm,
    transform: async (matches) => {
      const [shortUrl] = matches;
      const { redirectUrls } = await got.get(shortUrl);
      const aliX = referralSites.find(
        (config) => config.store === "aliexpress"
      );
      const [productUrl] = redirectUrls;
      const expandedMatches = aliX?.pattern.exec(productUrl);
      if (expandedMatches) {
        const newUrl = aliX?.transform(expandedMatches);
        return newUrl ? newUrl : null;
      }
      return null;
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
    const newLink = await store.transform(ctx.match as RegExpMatchArray);
    if (newLink) {
      const linkButton = new InlineKeyboard().url(store.buttonText, newLink);
      await ctx.reply(`Use o [link do PromoSup](${newLink})\\!`, {
        ...replyToSender(ctx),
        parse_mode: "MarkdownV2",
        reply_markup: linkButton,
      });
    }
    await next();
    return;
  }
);
