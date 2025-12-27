-- DropIndex
DROP INDEX "Journal_userId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Journal_userId_date_idx" ON "Journal"("userId", "date");
