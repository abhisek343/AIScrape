/*
  Warnings:

  - A unique constraint covering the columns `[userId,workflowId]` on the table `ChatSession` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChatSession_userId_key";

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "workflowId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_userId_workflowId_key" ON "ChatSession"("userId", "workflowId");
