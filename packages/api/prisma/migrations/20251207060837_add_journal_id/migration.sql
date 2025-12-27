/*
  Warnings:

  - The primary key for the `Journal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,date]` on the table `Journal` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Journal` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Journal_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_userId_date_key" ON "Journal"("userId", "date");
