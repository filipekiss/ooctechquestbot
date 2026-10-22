import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
import { BotModule } from "../main";
import { replyToReply } from "../utils/message";
import { generateLazerImage } from "./generate-image";

export const lazer = new Composer<OocContext>();

lazer.command("lazer", async (ctx, next) => {
  const receivedMessage = ctx.update.message;
  const replyToMessage = receivedMessage?.reply_to_message;
  if (!replyToMessage) {
    await next();
    return;
  }
  ctx.replyWithChatAction("upload_photo");
  const senderPhotos = await ctx.api.getUserProfilePhotos(
    receivedMessage.from?.id as number,
  );
  const receiverPhotos = await ctx.api.getUserProfilePhotos(
    replyToMessage.from?.id as number,
  );

  let senderPhotoFile;
  let receiverPhotoFile;

  if (senderPhotos.total_count > 0) {
    const [senderPhotoDetails] = senderPhotos.photos;
    const senderPhoto = senderPhotoDetails[2] ?? senderPhotoDetails[senderPhotoDetails.length - 1];
    const senderPhotoImage = await ctx.api.getFile(senderPhoto.file_id);
    senderPhotoFile = await senderPhotoImage.download();
  }
  if (receiverPhotos.total_count > 0) {
    const [receiverPhotoDetails] = receiverPhotos.photos;
    const receiverPhoto = receiverPhotoDetails[2] ?? receiverPhotoDetails[receiverPhotoDetails.length - 1];

    const receiverPhotoImage = await ctx.api.getFile(receiverPhoto.file_id);
    receiverPhotoFile = await receiverPhotoImage.download();
  }
  const image = await generateLazerImage(senderPhotoFile, receiverPhotoFile);
  ctx.replyWithPhoto(new InputFile(image), {
    ...replyToReply(ctx),
  });
});

export const lazerModule: BotModule = {
  command: "lazer",
  composer: lazer,
  shortDescription: "Responda alguém com /lazer",
};
