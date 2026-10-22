import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_ASSETS_FOLDER } from "../config/environment";
import { BotModule } from "../main";
import { replyToReplyOrToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const perdao = new Composer<OocContext>();

export const sendPerdao = withNext(async (context: OocContext) => {
  await context.replyWithPhoto(
    new InputFile(`${DEFAULT_ASSETS_FOLDER}/perdao.jpeg`),
    {
      ...replyToReplyOrToSender(context),
    }
  );
});

perdao.command(["perdoa", "perdao"], sendPerdao);

export const perdoaModule: BotModule = {
  command: "perdoa",
  alias: ["perdao"],
  shortDescription: "Os cara não perdoa uma",
  composer: perdao,
};
