import { Chat, ChatFromGetChat, ChatPhoto } from "@grammyjs/types";

export type GroupGetChat = Chat.SupergroupGetChat | Chat.GroupGetChat;
export type PrivateGetChat = Chat.PrivateGetChat;

export const isGroupGetChat = <T extends ChatFromGetChat>(
  chat: T
): chat is T & GroupGetChat => {
  return chat.type === "group" || chat.type === "supergroup";
};

type HasChatPhoto = { photo: ChatPhoto };

export const hasChatPhoto = <T extends ChatFromGetChat>(
  chat: T
): chat is T & HasChatPhoto => {
  return chat.photo !== undefined;
};
