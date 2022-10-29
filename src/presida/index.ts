import { ParseMode } from "@grammyjs/types";
import got from "got";
import { Composer } from "grammy";
import { clearInterval } from "timers";
import { OocContext } from "../config";
import { mdEscape } from "../main";
import { replyToReplyOrToSender } from "../utils/message";

let TIMEOUT_ID: ReturnType<typeof setInterval> | null = null;
let AUTO_UPDATE_PRESIDA = true;
/** Timeout for the autoupdates. Default is 5 minutes. In millisconds. */
let PRESIDA_TIMEOUT = 1000 * 60 * 5;
let PRESIDA_CALLBACK = (CHAT_ID: number): unknown => {
  return CHAT_ID;
};

let CHAT_ID = 0;

type Alphanum = string | number;

export const msToTime = (duration: number) => {
  let ms: Alphanum = Math.floor((duration % 1000) / 100),
    seconds: Alphanum = Math.floor((duration / 1000) % 60),
    minutes: Alphanum = Math.floor((duration / (1000 * 60)) % 60),
    hours: Alphanum = Math.floor((duration / (1000 * 60 * 60)) % 24);

  if (seconds < 1 && minutes < 1 && hours < 1) {
    return `${ms} milisegundos`;
  }

  if (minutes < 1 && hours < 1) {
    return `${seconds} segundos`;
  }

  if (hours < 1) {
    return `${minutes} minutos`;
  }

  return `${hours} horas`;
};

const API_URL =
  "https://resultados.tse.jus.br/oficial/ele2022/544/dados-simplificados/br/br-c0001-e000544-r.json";
const API_URL_SECOND_TERM =
  "https://resultados.tse.jus.br/oficial/ele2022/545/dados-simplificados/br/br-c0001-e000545-r.json";

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
  const missingValue = FULL_BAR - roundedValue;
  return `${new Array(roundedValue).fill(FILLED).join("")}${new Array(
    missingValue
  )
    .fill(EMPTY)
    .join("")}`;
};

export async function getElectionResultsMessage() {
  const response = await got(API_URL_SECOND_TERM).json<TSE_RESPONSE>();
  const output = [];
  const candidates = response.cand.map((candidate) => {
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
  output.push("");
  if (AUTO_UPDATE_PRESIDA) {
    output.push(`Atualizações automáticas estão ligadas`);
    output.push(`Atualizações a cada ${msToTime(PRESIDA_TIMEOUT)}`);
  } else {
    output.push(`Atualizações automáticas estão desligadas`);
  }
  return output.join("\n");
}
async function replyElectionResults(ctx: OocContext) {
  const replyMessageOptions = {
    ...replyToReplyOrToSender(ctx),
    parse_mode: "MarkdownV2" as ParseMode,
  };
  const parsedMessage = await getElectionResultsMessage();
  await ctx.reply(mdEscape(parsedMessage), replyMessageOptions);
}

export const presida = new Composer<OocContext>();
presida.command("presida", async (ctx, next) => {
  await ctx.replyWithChatAction("typing");
  await replyElectionResults(ctx);
  updateChatIdFromCtx(ctx);
  await next();
});
presida.command("disablepresida", async (ctx, next) => {
  AUTO_UPDATE_PRESIDA = false;
  updateChatIdFromCtx(ctx);
  ctx.reply(`Atualizações automáticas desligadas`);
  if (TIMEOUT_ID) {
    clearInterval(TIMEOUT_ID);
  }
  await next();
});
presida.command("enablepresida", async (ctx, next) => {
  AUTO_UPDATE_PRESIDA = true;
  updateChatIdFromCtx(ctx);
  await ctx.reply(`Atualizações automáticas ligadas`);
  await ctx.reply(`Atualizações a cada ${msToTime(PRESIDA_TIMEOUT)}`);
  setPresidaTimeout(PRESIDA_TIMEOUT);
  await next();
});
presida.command("presidatimeout", async (ctx, next) => {
  const [timeout] = ctx.match?.split(" ");
  if (timeout == undefined) {
    await ctx.reply("Utilize o formato /presidatimeout 300000");
    await next();
    return;
  }
  updateChatIdFromCtx(ctx);
  setPresidaTimeout(Number(timeout));
  await ctx.reply(
    `Atualizações automáticas serão enviadas e cada ${msToTime(
      PRESIDA_TIMEOUT
    )}`
  );
  await next();
});

const updateChatIdFromCtx = (ctx: OocContext) => {
  const currentChatId = ctx.update.message?.chat.id;
  if (currentChatId) {
    CHAT_ID = currentChatId;
  }
  console.log(`New Chat Id: ${CHAT_ID}`);
};

export const setPresidaTimeout = (timeout: number) => {
  if (TIMEOUT_ID) {
    clearInterval(TIMEOUT_ID);
    TIMEOUT_ID = null;
  }
  PRESIDA_TIMEOUT = timeout;
  TIMEOUT_ID = setInterval(async function () {
    if (CHAT_ID && PRESIDA_TIMEOUT > 0 && AUTO_UPDATE_PRESIDA) {
      console.log(
        `Autoupdate - Chat ${CHAT_ID} - ${msToTime(PRESIDA_TIMEOUT)}`
      );
      if (
        Object.prototype.toString.call(PRESIDA_CALLBACK) == "[object Function]"
      ) {
        await PRESIDA_CALLBACK(CHAT_ID);
      }
    }
  }, PRESIDA_TIMEOUT);
};

export function setPresidaCallback(fn: (CHAT_ID: number) => unknown) {
  PRESIDA_CALLBACK = fn;
}
