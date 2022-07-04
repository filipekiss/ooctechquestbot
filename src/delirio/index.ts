import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { DEFAULT_ASSETS_FOLDER } from "../config/environment";
import { BotModule } from "../main";
import { replyToReplyOrToSender } from "../utils/message";
import { withNext } from "../utils/middleware";

export const delirio = new Composer<OocContext>();

export const sendDelirio = withNext(async (context: OocContext) => {
  await context.replyWithPhoto(
    new InputFile(`${DEFAULT_ASSETS_FOLDER}/delirios.jpg`),
    {
      ...replyToReplyOrToSender(context),
    }
  );
});

delirio.command(["delirio", "delirios"], sendDelirio);

export const deliriosModule: BotModule = {
  command: "delirio",
  alias: ["delirios"],
  shortDescription: "Compra, pô. É o seu lazer.",
  composer: delirio,
};
