/*
  Warnings:

  - The primary key for the `Journal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Journal` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Journal` table. All the data in the column will be lost.
  - Added the required column `date` to the `Journal` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Journal_userId_idx";

-- AlterTable
ALTER TABLE "Journal" DROP CONSTRAINT "Journal_pkey",
DROP COLUMN "id",
DROP COLUMN "title",
ADD COLUMN     "date" TEXT NOT NULL,
ADD CONSTRAINT "Journal_pkey" PRIMARY KEY ("userId", "date");
