-- CreateTable
CREATE TABLE "ai_trial_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_trial_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_trial_usage_user_id_feature_key" ON "ai_trial_usage"("user_id", "feature");

-- AddForeignKey
ALTER TABLE "ai_trial_usage" ADD CONSTRAINT "ai_trial_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
