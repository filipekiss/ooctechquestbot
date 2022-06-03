import { OocContext } from "../config";
import { Composer } from "grammy";
import Keyv from "keyv";
import { BotModule } from "../main";
import { DB_FOLDER } from "../config/environment";

export const BANREASON_SCHEMA = {
  BAN_REASONS: "banreasons",
};

export async function getBanReason() {
  const banReasonsStr = (await banDB.get(
    BANREASON_SCHEMA.BAN_REASONS
  )) as string;
  const allReasons = banReasonsStr ? banReasonsStr.split("\n") : [];
  return {
    random: () =>
      [...allReasons][Math.floor(Math.random() * allReasons.length)],
    all: () => [...allReasons],
  };
}

const banDB = new Keyv(`sqlite://${DB_FOLDER}/ban.sqlite`);

function makeDbKey(phrase: string) {
  return phrase.replace(/[\s]/gi, "_").toLowerCase();
}

async function checkExistingReason(reasonKey: string) {
  return Boolean(await banDB.get(reasonKey));
}

async function addBanReason(reasonKey: string, banReason: string) {
  const allReasons = (await getBanReason()).all();
  const newReasons = [...allReasons, banReason];
  await banDB.set(BANREASON_SCHEMA.BAN_REASONS, newReasons.join("\n"));
  await banDB.set(reasonKey, banReason);
}

async function replyAlreadyAdded(ctx: OocContext) {
  const reason = ctx.match as string;
  ctx.reply(`"Banido por ${reason}" já existe!`, {
    reply_to_message_id: ctx.message!.message_id,
  });
}

const banReason = new Composer<OocContext>();
banReason.command("banreason", async (ctx: OocContext, next) => {
  const reason = ctx.match as string;
  if (!reason) {
    await next();
    return;
  }
  const reasonExists = await checkExistingReason(makeDbKey(reason));
  if (reasonExists) {
    await replyAlreadyAdded(ctx);
    await next();
    return;
  }
  await addBanReason(makeDbKey(reason), reason);
  ctx.reply(`Pronto! ${reason} é uma nova razão pra ser banido`);
  await next();
});

export const banReasonModule: BotModule = {
  command: "banreason",
  shortDescription: "Adiciona uma nova razão pra banir um usuário do chat",
  composer: banReason,
};
