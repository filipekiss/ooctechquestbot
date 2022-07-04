import { Composer } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { replyToReplyOrToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const revolta = new Composer<OocContext>();

revolta.command(
  ["revolta", "porra"],
  withNext(async (context: OocContext) => {
    await context.reply("(╯°□°）╯︵ ┻━┻", {
      ...replyToReplyOrToSender(context),
    });
  })
);

export const revoltaModule: BotModule = {
  command: "revolta",
  alias: ["porra"],
  composer: revolta,
  shortDescription: "Envia (╯°□°）╯︵ ┻━┻",
};
