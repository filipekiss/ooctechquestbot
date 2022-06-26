-- CreateEnum
CREATE TYPE "Pronoun" AS ENUM ('HE', 'SHE', 'THEY');

-- AlterTable
ALTER TABLE "TelegramUser" ADD COLUMN     "pronoun" "Pronoun" DEFAULT E'THEY';
