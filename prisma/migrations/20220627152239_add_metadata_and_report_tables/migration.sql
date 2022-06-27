-- CreateTable
CREATE TABLE "BotMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "json" JSONB
);

-- CreateTable
CREATE TABLE "ReportedMessage" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "reported_id" INTEGER NOT NULL,
    "message" JSONB NOT NULL,
    "message_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotMeta_key_key" ON "BotMeta"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ReportedMessage_message_id_key" ON "ReportedMessage"("message_id");

-- AddForeignKey
ALTER TABLE "ReportedMessage" ADD CONSTRAINT "ReportedMessage_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportedMessage" ADD CONSTRAINT "ReportedMessage_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
