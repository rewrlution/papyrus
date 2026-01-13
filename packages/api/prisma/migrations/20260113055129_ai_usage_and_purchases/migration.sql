-- CreateTable
CREATE TABLE "ai_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "generation_limit" INTEGER,
    "generation_used" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER,
    "currency" TEXT,

    CONSTRAINT "ai_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_purchases_user_id_product_idx" ON "ai_purchases"("user_id", "product");

-- CreateIndex
CREATE INDEX "ai_purchases_user_id_product_expires_at_idx" ON "ai_purchases"("user_id", "product", "expires_at");

-- AddForeignKey
ALTER TABLE "ai_purchases" ADD CONSTRAINT "ai_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
