import { Prisma } from ".prisma/client";
import { dbClient, JsonObject } from "./client";

export async function getMetaValue(
  key: string
): Promise<string | number | Prisma.JsonValue | undefined> {
  const dbValue = await dbClient.botMeta.findUnique({
    where: {
      key,
    },
  });
  if (dbValue?.value) {
    return dbValue.value;
  }
  if (dbValue?.count) {
    return dbValue.count;
  }
  return dbValue?.json;
}

export async function getMetaCount(key: string) {
  return dbClient.botMeta.findUnique({
    where: {
      key,
    },
    select: {
      count: true,
    },
  });
}

export const incrementMetaCount = async (
  key: string,
  incrementBy: number = 1
) => {
  return dbClient.botMeta.upsert({
    where: {
      key,
    },
    update: {
      count: {
        increment: incrementBy,
      },
    },
    create: {
      key,
      count: 1,
    },
  });
};

export const setMetaValue = async (
  key: string,
  value: string | number | Record<string, unknown>
) => {
  const isStringValue = typeof value === "string";
  const isNumberValue = typeof value === "number";
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
  if (isNumberValue) {
    return dbClient.botMeta.upsert({
      where: {
        key,
      },
      update: {
        count: value,
      },
      create: {
        key,
        count: value,
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
