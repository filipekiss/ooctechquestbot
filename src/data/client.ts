import { PrismaClient, Prisma } from "@prisma/client";

export const dbClient = new PrismaClient();

export type JsonObject = Prisma.JsonObject;
export type JsonArray = Prisma.JsonArray;
