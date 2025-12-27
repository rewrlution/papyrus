-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Journal_userId_updatedAt_idx" ON "Journal"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Journal_deletedAt_idx" ON "Journal"("deletedAt");
