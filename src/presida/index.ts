import { ParseMode } from "@grammyjs/types";
import got from "got";
import { Composer } from "grammy";
import { OocContext } from "../config";
import { mdEscape } from "../main";
import { replyToReplyOrToSender } from "../utils/message";

const API_URL =
  "https://resultados.tse.jus.br/oficial/ele2022/544/dados-simplificados/br/br-c0001-e000544-r.json";

interface Candidate {
  /** Nome */
  nm: string;
  /** Votos */
  vap: string;
  /** Percentual */
  pvap: string;
}
interface TSE_RESPONSE {
  /** Data */
  dt: string;
  /** Hora */
  ht: string;
  /** Candidatos */
  cand: Array<Candidate>;
  /** Total Seções */
  pst: string;
  /** Seções Apuradas */
  sa: string;
  /** Total Seções */
  s: string;
}

const makeProgressBar = (value: string): string => {
  const FULL_BAR = 30;
  const percentage = Math.round(parseInt(value) / 10) / 10;
  const roundedValue = FULL_BAR * percentage;
  const FILLED = "▮";
  const EMPTY = "▯";
  console.log({ value, roundedValue });
  const missingValue = FULL_BAR - roundedValue;
  return `${new Array(roundedValue).fill(FILLED).join("")}${new Array(
    missingValue
  )
    .fill(EMPTY)
    .join("")}`;
};

export const presida = new Composer<OocContext>();
presida.command("presida", async (ctx, next) => {
  await ctx.replyWithChatAction("typing");
  const response = await got(API_URL).json<TSE_RESPONSE>();
  const output = [];
  const candidates = response.cand.map((candidate) => {
    console.log(candidate);
    return `${candidate.nm.replace("&apos;", "'")} - ${candidate.pvap}% (${
      candidate.vap
    })\n${makeProgressBar(candidate.pvap)}`;
  });
  output.push(...candidates);
  output.push("*▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁*");
  output.push(`Seções Apuradas: ${response.sa} de ${response.s}`);
  output.push(
    `Atualizado em ${response.dt} ${response.ht} (Horário de Brasília)`
  );
  const replyMessageOptions = {
    ...replyToReplyOrToSender(ctx),
    parse_mode: "MarkdownV2" as ParseMode,
  };
  await ctx.reply(mdEscape(output.join("\n")), replyMessageOptions);
  await next();
});
