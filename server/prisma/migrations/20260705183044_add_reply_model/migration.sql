-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('agent', 'customer');

-- AlterTable
ALTER TABLE "ticket" RENAME CONSTRAINT "Ticket_pkey" TO "ticket_pkey";

-- CreateTable
CREATE TABLE "reply" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reply_ticketId_idx" ON "reply"("ticketId");

-- RenameForeignKey
ALTER TABLE "ticket" RENAME CONSTRAINT "Ticket_assignedToId_fkey" TO "ticket_assignedToId_fkey";

-- AddForeignKey
ALTER TABLE "reply" ADD CONSTRAINT "reply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply" ADD CONSTRAINT "reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
