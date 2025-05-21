import { User } from "@grammyjs/types";

export const getTelegramUserDetails = (user: User) => {
  return {
    first_name: user.first_name,
    last_name: user.last_name ?? null,
    username: user.username ?? null,
    telegram_id: user.id,
  };
};
