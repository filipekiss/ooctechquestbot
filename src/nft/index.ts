import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DB_FOLDER, DEFAULT_ASSETS_FOLDER } from "../config/environment";
import Keyv from "keyv";
import { ReplyMessage, User } from "@grammyjs/types";
import { MessageX } from "@grammyjs/hydrate/out/data/message";
import { replyToSender } from "../utils/message";
import { withNext } from "../utils/middleware";
import {
  addNftRecord,
  createNftDefinition,
  generateIdFromDefinition,
  getAllNftDefinitions,
  getNftDefinition,
  getRandomNftDefinition,
  incrementUsesCountById,
} from "../data/nft";
import { getTelegramUserDetails } from "../data/user";

const NFT_Meanings = [
  "Não Faço Trabalho",
  "Não Fode, Truta",
  "Naruto Fazendo Taijutsu",
  "Nem Fudendo, Tapado",
  "Nove Filas de Tatu",
  "Novos Filhos de Thanos",
  "Não Funciona o Testículo",
  "Necessidade de Fazer Terapia",
  "Nunca Fiz Tatuagem",
  "Never Felt Titties",
  "Need Female Touch",
  "Não Fumo Tabaco",
  "Neerlandês Fazendo Tulipa",
];

async function getOldNftMeanings() {
  const definitionListStr = (await nftDB.get(
    NFT_SCHEMA.NFT_MESSAGES
  )) as string;
  const definitionList = definitionListStr ? definitionListStr.split("\n") : [];
  const allMeanings = new Set([...NFT_Meanings, ...definitionList]);
  return {
    random: () =>
      [...allMeanings][Math.floor(Math.random() * allMeanings.size)],
    all: () => [...allMeanings],
  };
}

export const nft = new Composer<OocContext>();
nft.hears(
  /nft/i,
  withNext(async (ctx) => {
    const shouldSendImage = Math.floor(Math.random() * 10) + 1;
    if (shouldSendImage > 9) {
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

const NFT_SCHEMA = {
  NFT_MESSAGES: "nft_messages",
};

const nftDB = new Keyv(`sqlite://${DB_FOLDER}/nft.sqlite`);

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

nft.command(
  "migratenft",
  withNext(async (ctx) => {
    const [nftMeaning] = await getRandomNftDefinition();
    if (nftMeaning) {
      return;
    }
    const allMeanings = (await getOldNftMeanings()).all();
    const fullMeanings = (
      await Promise.all(
        allMeanings.map(
          async (meaning) => (await nftDB.get(meaning)) || meaning
        )
      )
    ).filter((x) => Boolean(x));
    await Promise.all(
      fullMeanings.map(async (meaning) => {
        if (meaning.message) {
          const created_at = new Date(meaning.message.date * 1000);
          const id = generateIdFromDefinition(joinNft(meaning));
          await addNftRecord({
            id,
            created_at: created_at.toISOString(),
            definition: joinNft(meaning),
            creator: {
              connectOrCreate: {
                where: {
                  telegram_id: meaning.message.from.id,
                },
                create: getTelegramUserDetails(meaning.message.from),
              },
            },
          });
          console.log(`Migrated ${joinNft(meaning)}`);
          return;
        }
        await createNftDefinition(meaning, ctx.from as User);
      })
    );
  })
);

export const nftModule = {
  composer: nft,
  command: "mint",
  shortDescription: "Adiciona uma nova definição para NFT",
  description:
    "Use esse comando para adicionar uma definição para NFT. O comando precisa seguir o formato `/mint <significado>` onde significado precisa ser uma frase de três palavras que comecem com N, F e T, respectivamente.",
};
