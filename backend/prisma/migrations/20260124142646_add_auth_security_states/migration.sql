-- CreateTable
CREATE TABLE "auth_security_states" (
    "user_id" TEXT NOT NULL,
    "auth_method" TEXT,
    "last_login_at" TIMESTAMP(3),
    "failed_sign_in_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_security_states_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "auth_security_states_locked_until_idx" ON "auth_security_states"("locked_until");

-- AddForeignKey
ALTER TABLE "auth_security_states" ADD CONSTRAINT "auth_security_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
