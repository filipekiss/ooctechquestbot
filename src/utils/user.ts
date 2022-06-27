import { TelegramUser } from ".prisma/client";
import { User } from "@grammyjs/types";
import { OocContext } from "../config";

export const isAdmin = async (context: OocContext) => {
  const chatMember = await context.getChatMember(context.from?.id as number);
  return ["creator", "administrator"].includes(chatMember.status);
};

export const getUsernameOrFullname = (user: User | TelegramUser) => {
  return user.username
    ? `@${user.username}`
    : `${user.first_name} ${user.last_name}`.trimEnd();
};
