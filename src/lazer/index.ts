import { Composer, InputFile } from "grammy";
import { OocContext } from "../config";
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
    receivedMessage.from?.id as number
  );
  const receiverPhotos = await ctx.api.getUserProfilePhotos(
    replyToMessage.from?.id as number
  );
  const [senderPhotoDetails] = senderPhotos.photos;
  const [receiverPhotoDetails] = receiverPhotos.photos;
  const [, , senderPhoto] = senderPhotoDetails;
  const [, , receiverPhoto] = receiverPhotoDetails;

  const senderPhotoImage = await ctx.api.getFile(senderPhoto.file_id);
  const receiverPhotoImage = await ctx.api.getFile(receiverPhoto.file_id);
  const senderPhotoFile = await senderPhotoImage.download();
  const receiverPhotoFile = await receiverPhotoImage.download();
  const image = await generateLazerImage(senderPhotoFile, receiverPhotoFile);
  ctx.replyWithPhoto(new InputFile(image), {
    reply_to_message_id: replyToMessage.message_id,
  });
});
