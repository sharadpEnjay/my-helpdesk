-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('open', 'pending', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "TicketCategory" AS ENUM ('general', 'billing', 'technical', 'bug', 'feature_request');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rename columns (only if old name exists)
DO $$ BEGIN
  ALTER TABLE "Ticket" RENAME COLUMN "title" TO "subject";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Ticket" RENAME COLUMN "description" TO "body";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Add new columns
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "bodyHtml" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "category" "TicketCategory";
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;

-- Make senderName and senderEmail required
UPDATE "Ticket" SET "senderName" = 'Unknown' WHERE "senderName" IS NULL;
UPDATE "Ticket" SET "senderEmail" = 'unknown@unknown.com' WHERE "senderEmail" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "senderName" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "senderEmail" SET NOT NULL;

-- Convert status from String to TicketStatus enum
ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus" USING (
  CASE
    WHEN "status" = 'OPEN' THEN 'open'::"TicketStatus"
    WHEN "status" = 'CLOSED' THEN 'closed'::"TicketStatus"
    WHEN "status" = 'RESOLVED' THEN 'resolved'::"TicketStatus"
    WHEN "status" = 'PENDING' THEN 'pending'::"TicketStatus"
    ELSE 'open'::"TicketStatus"
  END
);
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'open'::"TicketStatus";

-- Drop removed columns
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "source";
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "messageId";

-- Drop unused enum
DROP TYPE IF EXISTS "TicketSource";

-- Add foreign key
DO $$ BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rename table
ALTER TABLE "Ticket" RENAME TO "ticket";
