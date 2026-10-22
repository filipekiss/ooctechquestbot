import type Database from "better-sqlite3";

export type QuoteRow = {
  id: number;
  chat_id: string;
  key: string;
  channel_message_id: number;
  source_message_id: number;
  text: string | null;
  message_date: number;
  author_id: number;
  author_name: string;
  added_by_id: number;
  added_by_name: string;
  uses: number;
  image_file_id: string | null;
  created_at: number;
  refreshed_at: number;
};

export type NewQuote = Omit<QuoteRow, "id" | "uses" | "created_at" | "refreshed_at">;

type TopUser = { name: string; total: number } | undefined;

export const createQuoteStore = (db: Database.Database) => ({
  get: (chatId: string, key: string) =>
    db
      .prepare("SELECT * FROM quotes WHERE chat_id = ? AND key = ?")
      .get(chatId, key) as QuoteRow | undefined,

  getBySourceMessage: (chatId: string, messageId: number) =>
    db
      .prepare("SELECT * FROM quotes WHERE chat_id = ? AND source_message_id = ?")
      .get(chatId, messageId) as QuoteRow | undefined,

  add: (quote: NewQuote) =>
    db
      .prepare(
        `INSERT INTO quotes (chat_id, key, channel_message_id, source_message_id, text,
           message_date, author_id, author_name, added_by_id, added_by_name, image_file_id, created_at, refreshed_at)
         VALUES (@chat_id, @key, @channel_message_id, @source_message_id, @text,
           @message_date, @author_id, @author_name, @added_by_id, @added_by_name, @image_file_id, unixepoch(), unixepoch())`,
      )
      .run(quote),

  keys: (chatId: string) =>
    (
      db
        .prepare("SELECT key FROM quotes WHERE chat_id = ? ORDER BY key")
        .all(chatId) as { key: string }[]
    ).map((row) => row.key),

  remove: (chatId: string, key: string) =>
    db
      .prepare("DELETE FROM quotes WHERE chat_id = ? AND key = ?")
      .run(chatId, key).changes > 0,

  setChannelMessage: (id: number, channelMessageId: number, refreshedAt: number) =>
    db
      .prepare("UPDATE quotes SET channel_message_id = ?, refreshed_at = ? WHERE id = ?")
      .run(channelMessageId, refreshedAt, id),

  incrementUses: (id: number) =>
    db.prepare("UPDATE quotes SET uses = uses + 1 WHERE id = ?").run(id),

  setImageFileId: (id: number, fileId: string | null) =>
    db.prepare("UPDATE quotes SET image_file_id = ? WHERE id = ?").run(fileId, id),

  stats: (chatId: string) => {
    const top = (idCol: string, nameCol: string) =>
      db
        .prepare(
          `SELECT ${nameCol} AS name, COUNT(*) AS total FROM quotes
           WHERE chat_id = ? GROUP BY ${idCol} ORDER BY total DESC LIMIT 1`,
        )
        .get(chatId) as TopUser;
    const totals = db
      .prepare(
        "SELECT COUNT(*) AS quotes, COALESCE(SUM(uses), 0) AS uses FROM quotes WHERE chat_id = ?",
      )
      .get(chatId) as { quotes: number; uses: number };
    return {
      ...totals,
      topAuthor: top("author_id", "author_name"),
      topAdder: top("added_by_id", "added_by_name"),
    };
  },
});

export type QuoteStore = ReturnType<typeof createQuoteStore>;
