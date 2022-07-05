import { OocContext } from "../config";
import { Composer } from "grammy";
import { BotModule } from "../main";
import {
  getMessageAuthor,
  getMessageDate,
  replyToSender,
} from "../utils/message";
import { isAdmin } from "../utils/user";
import {
  addBanReasonRecord,
  deleteBanReason,
  disableReason,
  enableReason,
  generateIdFromReason,
  getAllBanReasons,
  getBanReasonFromReason,
} from "../data/ban-reason";
import { Message } from "@grammyjs/types";
import { getTelegramUserDetails } from "../data/user";

export const BANREASON_SCHEMA = {
  BAN_REASONS: "banreasons",
};

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
    ctx.replyWithChatAction("typing");
    const reasons = await getAllBanReasons();
    if (reasons.length > 0) {
      ctx.reply(reasons.map((reason) => reason.reason).join("\n"), {
        ...replyToSender(ctx),
      });
    } else {
      ctx.reply("Ainda não tenho nenhuma razão pra banir alguém");
    }
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
    const reasonExists = await getBanReasonFromReason(reasonToRemove);
    if (reasonExists && reasonExists.is_active) {
      await disableReason(reasonToRemove);
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
  const reasonExists = await getBanReasonFromReason(reason);
  if (reasonExists) {
    if (reasonExists.is_active) {
      await replyAlreadyAdded(ctx);
      await next();
      return;
    }
    await enableReason(reason);
    await replyReasonEnabled(ctx, reason);
    await next();
    return;
  }
  const creator = getMessageAuthor(ctx.message as Message);
  const date = getMessageDate(ctx.message as Message);
  const id = generateIdFromReason(reason);
  const created_at = new Date(date * 1000);
  await addBanReasonRecord({
    id,
    reason,
    created_at: created_at.toISOString(),
    creator: {
      connectOrCreate: {
        where: {
          telegram_id: creator.id,
        },
        create: getTelegramUserDetails(creator),
      },
    },
  });
  await replyReasonEnabled(ctx, reason);
  await next();
});

const replyReasonEnabled = async (ctx: OocContext, reason: string) => {
  return ctx.reply(`Pronto! ${reason} é uma nova razão pra ser banido`, {
    ...replyToSender(ctx),
  });
};

export const banReasonModule: BotModule = {
  command: "banreason",
  shortDescription: "Adiciona uma nova razão pra banir um usuário do chat",
  composer: banReason,
};
