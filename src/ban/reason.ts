import { OocContext } from "../config";
import { Composer } from "grammy";
import Keyv from "keyv";
import { BotModule } from "../main";
import { DB_FOLDER } from "../config/environment";
import { replyToSender } from "../utils/message";
import { isAdmin } from "../utils/user";

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

async function removeBanReason(reasonKey: string) {
  const allReasons = (await getBanReason()).all();
  const newReasons = allReasons.filter((reason) => {
    console.log({ reason });
    console.log({ reasonKeyGen: makeDbKey(reason) });
    console.log({ reasonKey });
    return makeDbKey(reason) !== reasonKey;
  });
  console.log(newReasons);
  await banDB.set(BANREASON_SCHEMA.BAN_REASONS, newReasons.join("\n"));
  await banDB.delete(reasonKey);
}

async function replyAlreadyAdded(ctx: OocContext) {
  const reason = ctx.match as string;
  ctx.reply(`"Banido por ${reason}" já existe!`, {
    ...replyToSender(ctx),
  });
}

const banReason = new Composer<OocContext>();
banReason.command("banreason", async (ctx: OocContext, next) => {
  const reason = ctx.match as string;
  if (!reason || reason === "list") {
    const reasonList = (await getBanReason()).all();
    ctx.reply(reasonList.join("\n"), {
      ...replyToSender(ctx),
    });
    await next();
    return;
  }

  if (reason.startsWith("remove ")) {
    const isUserAdmin = await isAdmin(ctx);
    if (!isUserAdmin) {
      ctx.reply("Apenas admins podem remover razões pra ser banido", {
        ...replyToSender(ctx),
      });
      await next();
      return;
    }
    const [, ...reasonParts] = reason.split(" ");

    const reasonToRemove = reasonParts.join(" ");
    const reasonKey = makeDbKey(reasonToRemove);
    const reasonExists = await checkExistingReason(reasonKey);
    if (reasonExists) {
      await removeBanReason(reasonKey);
      ctx.reply(
        `Pronto! ${reasonToRemove} não é mais uma razão pra ser banido`,
        {
          ...replyToSender(ctx),
        }
      );
    } else {
      ctx.reply(
        `Parece que ${reasonToRemove} ainda não é uma razão pra ser banido`,
        {
          ...replyToSender(ctx),
        }
      );
    }
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
  ctx.reply(`Pronto! ${reason} é uma nova razão pra ser banido`, {
    ...replyToSender(ctx),
  });
  await next();
});

export const banReasonModule: BotModule = {
  command: "banreason",
  shortDescription: "Adiciona uma nova razão pra banir um usuário do chat",
  composer: banReason,
};
