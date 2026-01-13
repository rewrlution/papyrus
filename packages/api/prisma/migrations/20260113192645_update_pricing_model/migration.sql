/*
  Warnings:

  - You are about to drop the column `generation_limit` on the `ai_purchases` table. All the data in the column will be lost.
  - You are about to drop the column `generation_used` on the `ai_purchases` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_purchases" DROP COLUMN "generation_limit",
DROP COLUMN "generation_used";
