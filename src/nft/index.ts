import { Composer } from "grammy";
import { OocContext } from "../config";
import { DB_FOLDER } from "../config/environment";
import Keyv from "keyv";
import { ReplyMessage } from "@grammyjs/types";
import { MessageX } from "@grammyjs/hydrate/out/data/message";

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

async function getNftMeaning() {
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
nft.hears(/nft/i, async (ctx) => {
  const receivedMessage = ctx.message!;
  const nftMeaning = (await getNftMeaning()).random();
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

const isValidNftMeaning = (n: string, f: string, t: string) => {
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
  const allMeanings = (await getNftMeaning()).all();
  const receivedMessage = ctx.message!;
  const botReply = await ctx.reply(
    `Significados de NFT: \n${allMeanings
      .sort(new Intl.Collator("pt-br").compare)
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

nft.command("mint", async (ctx) => {
  const action = ctx.match;
  if (action === "list") {
    return sendNftList(ctx);
  }
  const [n, f, t] = ctx.match.split(" ");
  if (!n || !f || !t || !isValidNftMeaning(n, f, t))
    return replyInvalidMeaning(ctx);
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
  const timeout = 15000;
  deleteMessage(receivedMessage, timeout);
  deleteMessage(botReply, timeout);
  return;
});

export const nftModule = {
  composer: nft,
  command: "mint",
  shortDescription: "Adiciona uma nova definição para NFT",
  description:
    "Use esse comando para adicionar uma definição para NFT. O comando precisa seguir o formato `/mint <significado>` onde significado precisa ser uma frase de três palavras que comecem com N, F e T, respectivamente.",
};
