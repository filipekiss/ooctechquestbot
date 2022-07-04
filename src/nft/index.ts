import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_ASSETS_FOLDER } from "../config/environment";
import { ReplyMessage, User } from "@grammyjs/types";
import { MessageX } from "@grammyjs/hydrate/out/data/message";
import { replyToSender, sendAsMarkdown } from "../utils/message";
import { withNext } from "../utils/middleware";
import {
  createNftDefinition,
  getAllNftDefinitions,
  getNftDefinition,
  getNftStats,
  getRandomNftDefinition,
  incrementUsesCountById,
  META_NFT_IMAGE_COUNT,
  META_NFT_TOTAL_USES_COUNT,
} from "../data/nft";
import { getMetaValue, incrementMetaCount, setMetaValue } from "../data/meta";
import { getUsernameOrFullname } from "../utils/user";
import { mdEscape } from "../main";

export const nft = new Composer<OocContext>();
nft.hears(
  /nft/i,
  withNext(async (ctx) => {
    await incrementMetaCount(META_NFT_TOTAL_USES_COUNT);
    const shouldSendImage = Math.floor(Math.random() * 10) + 1;
    if (shouldSendImage > 9) {
      await incrementMetaCount(META_NFT_IMAGE_COUNT);
      ctx.replyWithChatAction("upload_photo");
      await ctx.replyWithPhoto(
        new InputFile(`${DEFAULT_ASSETS_FOLDER}/nft.jpg`),
        replyToSender(ctx)
      );
      return;
    }
    const [nftMeaning] = await getRandomNftDefinition();
    if (!nftMeaning) {
      return;
    }
    await incrementUsesCountById(nftMeaning.id);
    await ctx.reply(`NFT significa "${nftMeaning.definition}"`, {
      ...replyToSender(ctx),
    });
  })
);

type NftDefinition = {
  n: string;
  f: string;
  t: string;
  message: ReplyMessage;
};

const isValidMeaning = (x: string, startWith: string) =>
  x.toLowerCase().startsWith(startWith);
const titleCase = (word: string) => `${word[0].toUpperCase()}${word.slice(1)}`;

const isValidNftMeaning = (n: string, f: string, t: string) => {
  const isNValid = isValidMeaning(n, "n");
  const isFValid = isValidMeaning(f, "f");
  const isTValid = isValidMeaning(t, "t");
  return isNValid && isFValid && isTValid;
};

const joinNft = ({ n, f, t }: NftDefinition) => `${n} ${f} ${t}`;

async function replyAlreadyAdded(ctx: OocContext) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply("Essa definição já existe.", {
    reply_to_message_id: receivedMessage.message_id,
  });
  deleteMessage(receivedMessage, 15000);
  deleteMessage(botReply, 15000);
  return;
}

async function replyInvalidMeaning(ctx: OocContext) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply(
    `"${ctx.match}" não é um significado válido para NFT. As palavras devem começar com N, F e T, na ordem.`,
    {
      reply_to_message_id: receivedMessage.message_id,
    }
  );
  deleteMessage(receivedMessage, 60000);
  deleteMessage(botReply, 60000);
  return;
}

async function sendNftList(ctx: OocContext) {
  const allMeanings = await getAllNftDefinitions();
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply(
    `Significados de NFT: \n${allMeanings
      .map((definition) => {
        return definition.definition;
      })
      .join("\n")}`,
    {
      parse_mode: "MarkdownV2",
    }
  );
  const timeout = 60000;
  deleteMessage(receivedMessage, timeout);
  deleteMessage(botReply, timeout);
  return;
}

async function sendNftStats(ctx: OocContext) {
  const nftStats = await getNftStats();

  const output: string[] = [];
  output.push(`*Quantidade de definições*: ${nftStats.totalNftDefinitions}`);
  const { topUser } = nftStats;
  if (topUser) {
    output.push(
      `*Usuário que mais criou definições*: ${getUsernameOrFullname(
        topUser.creator
      )}`
    );
  }
  const { topThreeUsedDefinitions } = nftStats;
  output.push(
    `*Top ${
      topThreeUsedDefinitions.length
    } definições mais usadas*\n${topThreeUsedDefinitions
      .map(
        (definition) => ` • \`${definition.definition}\` - ${definition.uses}`
      )
      .join("\n")}`
  );
  const botReply = await ctx.reply(mdEscape(output.join("\n")), {
    ...sendAsMarkdown(),
    ...replyToSender(ctx),
  });
  const receivedMessage = ctx.message!;
  const timeout = 60000;
  deleteMessage(receivedMessage, timeout);
  deleteMessage(botReply, timeout);
  return;
}

function deleteMessage(message: MessageX, timeout: number) {
  setTimeout(async () => {
    try {
      await message.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, timeout);
}

nft.command(
  "mint",
  withNext(async (ctx) => {
    const action = ctx.match as string;
    if (action === "list") {
      return sendNftList(ctx);
    }
    if (action === "stats") {
      return sendNftStats(ctx);
    }
    const [n, f, t] = action.split(" ");
    if (!n || !f || !t || !isValidNftMeaning(n, f, t))
      return replyInvalidMeaning(ctx);
    const definition = {
      n: titleCase(n),
      f: titleCase(f),
      t: titleCase(t),
      message: ctx.message as ReplyMessage,
    };
    const existingDefinition = await getNftDefinition(joinNft(definition));
    if (existingDefinition) {
      return replyAlreadyAdded(ctx);
    }
    await createNftDefinition(joinNft(definition), ctx.from as User);
    const receivedMessage = ctx.message!;
    const botReply = await ctx.reply(`Definição adicionada`, {
      reply_to_message_id: receivedMessage.message_id,
    });
    const timeout = 15000;
    deleteMessage(receivedMessage, timeout);
    deleteMessage(botReply, timeout);
    return;
  })
);

export const nftModule = {
  composer: nft,
  command: "mint",
  shortDescription: "Adiciona uma nova definição para NFT",
  description:
    "Use esse comando para adicionar uma definição para NFT. O comando precisa seguir o formato `/mint <significado>` onde significado precisa ser uma frase de três palavras que comecem com N, F e T, respectivamente.",
};
