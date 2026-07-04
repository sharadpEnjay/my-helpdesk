-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('manual', 'email');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "source" "TicketSource" NOT NULL DEFAULT 'manual',
ADD COLUMN "senderEmail" TEXT,
ADD COLUMN "senderName" TEXT,
ADD COLUMN "messageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_messageId_key" ON "Ticket"("messageId");
