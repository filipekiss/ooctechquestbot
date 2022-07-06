-- CreateTable
CREATE TABLE "Ooc" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quoted_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "image" TEXT,

    CONSTRAINT "Ooc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ooc_message_id_key" ON "Ooc"("message_id");

-- AddForeignKey
ALTER TABLE "Ooc" ADD CONSTRAINT "Ooc_quoted_id_fkey" FOREIGN KEY ("quoted_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ooc" ADD CONSTRAINT "Ooc_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
