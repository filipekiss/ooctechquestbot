-- CreateTable
CREATE TABLE "BotChat" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "telegram_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramGroupChat" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "bot_chat_id" INTEGER NOT NULL,
    "telegram_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "permissions" JSONB,
    "photo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramGroupChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramPrivateChat" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "bot_chat_id" INTEGER NOT NULL,
    "telegram_id" INTEGER NOT NULL,
    "has_private_forwards" BOOLEAN,
    "photo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramPrivateChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" SERIAL NOT NULL,
    "telegram_id" INTEGER NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "username" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "quoted_by_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "message" JSONB NOT NULL,
    "chat_id" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BotChatToTelegramUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BotChat_telegram_id_key" ON "BotChat"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramGroupChat_bot_chat_id_key" ON "TelegramGroupChat"("bot_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramGroupChat_telegram_id_key" ON "TelegramGroupChat"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramPrivateChat_bot_chat_id_key" ON "TelegramPrivateChat"("bot_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramPrivateChat_telegram_id_key" ON "TelegramPrivateChat"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegram_id_key" ON "TelegramUser"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_key_key" ON "Quote"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_message_id_key" ON "Quote"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "_BotChatToTelegramUser_AB_unique" ON "_BotChatToTelegramUser"("A", "B");

-- CreateIndex
CREATE INDEX "_BotChatToTelegramUser_B_index" ON "_BotChatToTelegramUser"("B");

-- AddForeignKey
ALTER TABLE "TelegramGroupChat" ADD CONSTRAINT "TelegramGroupChat_bot_chat_id_fkey" FOREIGN KEY ("bot_chat_id") REFERENCES "BotChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramPrivateChat" ADD CONSTRAINT "TelegramPrivateChat_bot_chat_id_fkey" FOREIGN KEY ("bot_chat_id") REFERENCES "BotChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_quoted_by_id_fkey" FOREIGN KEY ("quoted_by_id") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BotChatToTelegramUser" ADD CONSTRAINT "_BotChatToTelegramUser_A_fkey" FOREIGN KEY ("A") REFERENCES "BotChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BotChatToTelegramUser" ADD CONSTRAINT "_BotChatToTelegramUser_B_fkey" FOREIGN KEY ("B") REFERENCES "TelegramUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
