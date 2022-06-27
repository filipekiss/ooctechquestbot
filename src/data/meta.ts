import { dbClient, JsonObject } from "./client";

export const getMetaValue = async (key: string) => {
  const dbValue = await dbClient.botMeta.findUnique({
    where: {
      key,
    },
  });
  return dbValue?.value ? dbValue.value : dbValue?.json;
};

export const setMetaValue = async (
  key: string,
  value: string | Record<string, unknown>
) => {
  const isStringValue = typeof value === "string";
  if (isStringValue) {
    return dbClient.botMeta.upsert({
      where: {
        key,
      },
      update: {
        value,
      },
      create: {
        key,
        value,
      },
    });
  }
  return dbClient.botMeta.upsert({
    where: {
      key,
    },
    update: {
      json: value as JsonObject,
    },
    create: {
      key,
      json: value as JsonObject,
    },
  });
};
