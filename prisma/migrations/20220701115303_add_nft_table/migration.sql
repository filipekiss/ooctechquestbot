-- CreateTable
CREATE TABLE "NftDefinition" (
    "id" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NftDefinition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NftDefinition" ADD CONSTRAINT "NftDefinition_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
