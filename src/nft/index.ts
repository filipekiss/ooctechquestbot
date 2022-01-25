import {Composer} from 'grammy'
import {OocContext} from '../config';

const  NFT_Meanings = [
  "Não Faço Trabalho",
  "Não Fode, Truta",
  "Naruto Fazendo Taijutsu",
  "Nem Fudendo, Tapado",
  "Nove Filas de Tatu",
  "Novos Filhos de Thanos",
];

export const nft = new Composer<OocContext>();
nft.hears(/nft/, async (ctx) => {
  const receivedMessage = ctx.message!;
  const nftMeandng = NFT_Meanings[Math.floor(Math.random()*NFT_Meanings.length)];
  const botReply = await ctx.reply(`NFT significa "${nftMeandng}"`,
                                   {
    reply_to_message_id: receivedMessage.message_id,
  });
  return;
});

