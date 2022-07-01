import { User } from "@grammyjs/types";
import { dbClient } from "./client";
import { getTelegramUserDetails } from "./user";
import { v5 as uuidv5 } from "uuid";
import { NftDefinition, Prisma } from ".prisma/client";

const NFT_NAMESPACE = "d69aab2c-d254-4955-9d4d-c91da93b4f36";

export const getNftDefinition = (definition: string) => {
  const id = generateIdFromDefinition(definition);
  return dbClient.nftDefinition.findFirst({
    where: {
      id,
    },
  });
};

export const getAllNftDefinitions = () => {
  return dbClient.nftDefinition.findMany({
    orderBy: {
      definition: "asc",
    },
  });
};

export const createNftDefinition = (definition: string, creator: User) => {
  const id = generateIdFromDefinition(definition);
  return addNftRecord({
    id,
    definition,
    creator: {
      connectOrCreate: {
        create: getTelegramUserDetails(creator),
        where: {
          telegram_id: creator.id,
        },
      },
    },
  });
};

export const addNftRecord = (
  data: Prisma.XOR<
    Prisma.NftDefinitionCreateInput,
    Prisma.NftDefinitionUncheckedCreateInput
  >
) => {
  return dbClient.nftDefinition.create({ data });
};

export const generateIdFromDefinition = (definition: string) => {
  return uuidv5(definition.toLowerCase(), NFT_NAMESPACE);
};

export const getRandomNftDefinition = () => {
  return dbClient.$queryRaw`SELECT * FROM "NftDefinition" ORDER BY random() LIMIT 1;` as Promise<
    NftDefinition[]
  >;
};

export const incrementUsesCountById = (id: string) => {
  return dbClient.nftDefinition.update({
    where: {
      id,
    },
    data: {
      uses: {
        increment: 1,
      },
    },
  });
};
