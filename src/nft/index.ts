import { Composer } from "grammy";
import { OocContext } from "../config";
import { DB_FOLDER } from "../config/environment";
import Keyv from "keyv";
import { ReplyMessage } from "@grammyjs/types";

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

export const nft = new Composer<OocContext>();
nft.hears(/nft/i, async (ctx) => {
  const receivedMessage = ctx.message!;
  const definitionListStr = (await nftDB.get(
    NFT_SCHEMA.NFT_MESSAGES
  )) as string;
  const definitionList = definitionListStr ? definitionListStr.split("\n") : [];
  const allMeanings = [...NFT_Meanings, ...definitionList];
  console.log(allMeanings)
  const nftMeaning =
    allMeanings[Math.floor(Math.random() * allMeanings.length)];
  return await ctx.reply(`NFT significa "${nftMeaning}"`, {
    reply_to_message_id: receivedMessage.message_id,
  });
});

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

const validateNftMeaning = (n: string, f: string, t: string) => {
  const isNValid = isValidMeaning(n, "n");
  const isFValid = isValidMeaning(f, "f");
  const isTValid = isValidMeaning(t, "t");
  return isNValid && isFValid && isTValid;
};

const joinNft = ({ n, f, t }: NftDefinition) => `${n} ${f} ${t}`;

const addDefinition = async (definition: NftDefinition) => {
  const definitionListStr = (await nftDB.get(
    NFT_SCHEMA.NFT_MESSAGES
  )) as string;
  const definitionList = definitionListStr ? definitionListStr.split("\n") : [];
  await nftDB.set(joinNft(definition), definition);
  definitionList.push(joinNft(definition));
  await nftDB.set(NFT_SCHEMA.NFT_MESSAGES, definitionList.join("\n"));
};

async function replyAlreadyAdded(ctx: OocContext) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply("Essa definição já existe.", {
    reply_to_message_id: receivedMessage.message_id,
  });
  setTimeout(async () => {
    try {
      await receivedMessage.delete();
      await botReply.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, 15000);
  return;
}

async function replyInvalidMeaning(ctx: OocContext) {
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply(
    `${ctx.match} não é um significado válido para NFT`,
    {
      reply_to_message_id: receivedMessage.message_id,
    }
  );
  setTimeout(async () => {
    try {
      await receivedMessage.delete();
      await botReply.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, 15000);
  return;
}

nft.command("mint", async (ctx) => {
  const [n, f, t] = ctx.match.split(" ");
  if (!n || !f || !t) return false
  const isValidNFT = validateNftMeaning(n, f, t);
  if (!isValidNFT) {
    return replyInvalidMeaning(ctx);
  }
  const definition = {
    n: titleCase(n),
    f: titleCase(f),
    t: titleCase(t),
    message: ctx.message as ReplyMessage,
  };
  const existingDefinition = await nftDB.get(joinNft(definition));
  if (existingDefinition || NFT_Meanings.includes(joinNft(definition))) {
    return replyAlreadyAdded(ctx);
  }
  await addDefinition(definition);
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply(`Definição adicionada`, {
    reply_to_message_id: receivedMessage.message_id,
  });
  setTimeout(async () => {
    try {
      await receivedMessage.delete();
      await botReply.delete();
    } catch {
      console.warn("Unable to delete message. Skipping…");
    }
  }, 15000);
  return;
});
