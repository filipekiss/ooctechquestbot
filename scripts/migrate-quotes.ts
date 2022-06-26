import Keyv from "keyv";
import { DB_FOLDER } from "../src/config/environment";
import { createQuote, getQuoteByKey } from "../src/data/quote";

const quoteDB = new Keyv(`sqlite://${DB_FOLDER}/quote.sqlite`);

export const QUOTE_SCHEMA = {
  QUOTES_KEYS: "quotes_keys",
};
export async function getQuoteKeys() {
  const quotesKeys = (await quoteDB.get(QUOTE_SCHEMA.QUOTES_KEYS)) as string;
  const allQuoteKeys = quotesKeys ? quotesKeys.split("\n") : [];
  return {
    all: () => [...allQuoteKeys],
  };
}

(async () => {
  const keyvQuotesKeys = (await getQuoteKeys()).all();
  const statuses = await Promise.all(
    keyvQuotesKeys.map(async (key) => {
      const keyvQuote = await quoteDB.get(key);
      console.log({ keyvQuote });
      delete keyvQuote.ooc_quote_key;
      // check if prisma db has the quote already
      const existingQuoteKey = await getQuoteByKey(key);
      if (existingQuoteKey) {
        return { key, status: "already exists" };
      }
      await createQuote(key, keyvQuote, keyvQuote.from, keyvQuote.from);
      return { key, status: "created" };
    })
  );
  console.log({ statuses });
})();
