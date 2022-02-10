import { Composer } from "grammy";
import { OocContext } from "../config";

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
  const nftMeaning =
    NFT_Meanings[Math.floor(Math.random() * NFT_Meanings.length)];
  return await ctx.reply(`NFT significa "${nftMeaning}"`, {
    reply_to_message_id: receivedMessage.message_id,
  });
});
