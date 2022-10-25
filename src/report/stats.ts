import { Composer } from "grammy";
import { OocContext } from "../config";
import { getReportStats } from "../data/report";
import { BotModule, mdEscape } from "../main";
import { sendAsMarkdown } from "../utils/message";
import { withNext } from "../utils/middleware";
import { getUsernameOrFullname } from "../utils/user";

const reportStats = new Composer<OocContext>();

const RANKING = ["🥇", "🥈", "🥉", "🏅"];

reportStats.command(
  "reportstats",
  withNext(async (ctx) => {
    const quoteStats = await getReportStats();
    ctx.replyWithChatAction("typing");
    const output: string[] = [];
    output.push(
      `*Quantidade de Mensagens Reportadas*: ${quoteStats.totalReportedMessages}`
    );
    const { top3ReportedUser } = quoteStats;
    output.push(`*Ranking Usuários Reportados*:`);
    top3ReportedUser.forEach((user, index) => {
      output.push(
        `${RANKING[index] || RANKING[3]} ${mdEscape(
          getUsernameOrFullname(user.reported),
          {
            escapeItalic: true,
          }
        )} \\(${user._count.id}\\)`
      );
    });
    const { top3ReporterUser } = quoteStats;
    output.push(`*Ranking Usuários que mais Reportaram*:`);
    top3ReporterUser.forEach((user, index) => {
      output.push(
        `${RANKING[index] || RANKING[3]} ${mdEscape(
          getUsernameOrFullname(user.reporter),
          {
            escapeItalic: true,
          }
        )} \\(${user._count.id}\\)`
      );
    });
    ctx.reply(output.join("\n"), {
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
