import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_ASSETS_FOLDER } from "../config/environment";
import { BotModule } from "../main";
import { replyToReplyOrToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const perdao = new Composer<OocContext>();

export const sendDelirio = withNext(async (context: OocContext) => {
  await context.replyWithPhoto(
    new InputFile(`${DEFAULT_ASSETS_FOLDER}/perdao.jpeg`),
    {
      ...replyToReplyOrToSender(context),
    }
  );
});

perdao.command(["perdoa", "perdao"], sendDelirio);

export const perdoaModule: BotModule = {
  command: "perdoa",
  alias: ["perdoa", "perdao"],
  shortDescription: "Os cara não perdoa uma",
  composer: perdao,
};
