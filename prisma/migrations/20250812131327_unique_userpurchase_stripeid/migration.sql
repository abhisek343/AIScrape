/*
  Warnings:

  - A unique constraint covering the columns `[stripeId]` on the table `UserPurchase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_stripeId_key" ON "UserPurchase"("stripeId");
