-- AlterTable
ALTER TABLE "reply" ADD COLUMN     "senderEmail" TEXT,
ADD COLUMN     "emailMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "reply_emailMessageId_key" ON "reply"("emailMessageId");
