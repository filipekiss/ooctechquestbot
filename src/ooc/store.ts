import type Database from "better-sqlite3";

export type NewOoc = {
  source_message_id: number;
  author_id: number;
  author_name: string;
  forwarded_by_id: number;
  forwarded_by_name: string;
};

type TopUser = { name: string; total: number } | undefined;

export const createOocStore = (db: Database.Database) => ({
  has: (messageId: number) =>
    db
      .prepare("SELECT 1 FROM oocs WHERE source_message_id = ?")
      .get(messageId) !== undefined,

  add: (ooc: NewOoc) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO oocs (source_message_id, author_id, author_name,
           forwarded_by_id, forwarded_by_name, created_at)
         VALUES (@source_message_id, @author_id, @author_name,
           @forwarded_by_id, @forwarded_by_name, unixepoch())`,
      )
      .run(ooc),

  stats: (userId: number) => {
    const top = (idCol: string, nameCol: string) =>
      db
        .prepare(
          `SELECT ${nameCol} AS name, COUNT(*) AS total FROM oocs
           GROUP BY ${idCol} ORDER BY total DESC LIMIT 1`,
        )
        .get() as TopUser;
    const count = (col: string) =>
      (
        db
          .prepare(`SELECT COUNT(*) AS total FROM oocs WHERE ${col} = ?`)
          .get(userId) as { total: number }
      ).total;
    const summary = db
      .prepare("SELECT COUNT(*) AS total, MIN(created_at) AS since FROM oocs")
      .get() as { total: number; since: number | null };
    return {
      ...summary,
      topAuthor: top("author_id", "author_name"),
      topForwarder: top("forwarded_by_id", "forwarded_by_name"),
      timesQuoted: count("author_id"),
      timesCreated: count("forwarded_by_id"),
    };
  },
});

export type OocStore = ReturnType<typeof createOocStore>;
