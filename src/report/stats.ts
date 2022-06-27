import { Composer } from "grammy";
import { OocContext } from "../config";
import { getReportStats } from "../data/report";
import { BotModule, mdEscape } from "../main";
import { sendAsMarkdown } from "../utils/message";
import { withNext } from "../utils/middleware";
import { getUsernameOrFullname } from "../utils/user";

const reportStats = new Composer<OocContext>();

reportStats.command(
  "reportstats",
  withNext(async (ctx) => {
    const quoteStats = await getReportStats();
    ctx.replyWithChatAction("typing");
    const output: string[] = [];
    output.push(
      `*Quantidade de Mensagens Reportadas*: ${quoteStats.totalReportedMessages}`
    );
    const { topReportedUser } = quoteStats;
    output.push(
      `*Usuário mais reportado*: ${getUsernameOrFullname(
        topReportedUser.reported
      )}`
    );
    const { topReporter } = quoteStats;
    output.push(
      `*Usuário que mais reportou mensagens*: ${getUsernameOrFullname(
        topReporter.reporter
      )}`
    );
    ctx.reply(mdEscape(output.join("\n")), {
      ...sendAsMarkdown(),
    });
  })
);

/**
 *
    case "stats": {
      await next();
      return;
    }
**/
export const reportStatsModule: BotModule = {
  composer: reportStats,
  command: "reportstats",
  shortDescription: "Envia as estatísticas sobre os reports",
};
