/*
  Warnings:

  - You are about to drop the `UserBalanace` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "UserBalanace";

-- CreateTable
CREATE TABLE "UserBalance" (
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("userId")
);
