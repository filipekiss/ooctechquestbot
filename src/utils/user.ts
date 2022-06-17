import { OocContext } from "../config";

export const isAdmin = async (context: OocContext) => {
  const chatMember = await context.getChatMember(context.from?.id as number);
  return ["creator", "administrator"].includes(chatMember.status);
};
