import got from "got/dist/source";
import { Composer, InlineKeyboard } from "grammy";
import { OocContext } from "../config";
import { AMAZON_AFFILIATE_TAG as AMAZON_AFFILIATE_TAG_ENV } from "../config/environment";
import { replyToSender } from "../utils/message";

const AMAZON_AFFILIATE_TAG = AMAZON_AFFILIATE_TAG_ENV;

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
      /(https:\/\/(?:www\.)?amazon\.com\.br)\/(?:[^\/]+\/)*([^\/]+)\/ref=(?:[^\/?]+)/m,
    transform: (matches) => {
      const [, amazonUrl, id] = matches;
      const affiliate = `?tag=${AMAZON_AFFILIATE_TAG}`;
      return `${amazonUrl}/dp/${id}${affiliate}`;
    },
  },
  {
    buttonText: "Ver na Amazon",
    store: "amznto",
    pattern: /(https:\/\/(?:[a-z0-9].*\.)?amzn.to\/.*)(?:\?.*)?/m,
    transform: (matches) => expandAndTransform(matches[0], "amazon"),
  },
  {
    buttonText: "Ver na Amazon",
    store: "acod",
    pattern: /(https:\/\/)a.co\/[a-z]\/.*/m,
    transform: (matches) => expandAndTransform(matches[0], "amazon"),
  },
  {
    store: "americanas",
    buttonText: "Ver na Americanas",
    pattern: /(https:\/\/(?:www.)?americanas.com.br\/.*)/m,
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
      /(https:\/\/(?:[a-z0-9].*\.)?aliexpress.com\/item\/.*.html)(?:.*)/m,

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
    pattern: /(https:\/\/(?:[a-z0-9].*\.)?aliexpress.com\/.*)(?:\?.*)?/m,
    transform: (matches) => expandAndTransform(matches[0], "aliexpress"),
  },
  {
    store: "magazineluiza",
    buttonText: "Ver no Magazine",

    pattern: /(http(?:s)?:\/\/(?:www.)?magazinevoce.com.br)\/([^\/]+)\/(.*)/m,

    transform: (matches) => {
      const [, magazineUrl, , productDetails] = matches;
      const affiliate = "magazinepromosupoficial";
      return `${magazineUrl}/${affiliate}/${productDetails}`;
    },
  },
];

// Follows the short link and runs the target store's transform on the first redirect.
async function expandAndTransform(
  shortUrl: string,
  store: string,
): Promise<string | null> {
  try {
    const { redirectUrls } = await got.get(shortUrl);
    const target = referralSites.find((config) => config.store === store);
    const expandedMatches = redirectUrls[0]?.match(target!.pattern);
    return expandedMatches ? await target!.transform(expandedMatches) : null;
  } catch {
    console.log("Error expanding link");
    return null;
  }
}

export const referral = new Composer<OocContext>();
referral.hears(
  referralSites.map((ref) => ref.pattern),
  async (ctx, next) => {
    const receivedMessage = ctx.message!;
    const store = referralSites.find((config) => {
      return (
        receivedMessage.text?.match(config.pattern) ||
        receivedMessage.caption?.match(config.pattern)
      );
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
  }
);
