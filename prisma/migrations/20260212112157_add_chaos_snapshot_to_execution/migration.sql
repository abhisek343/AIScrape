-- AlterTable
ALTER TABLE "WorkflowExecution" ADD COLUMN     "inputs" TEXT;

-- CreateTable
CREATE TABLE "WorkflowData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowData_userId_expiresAt_idx" ON "WorkflowData"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowData_userId_storageKey_key" ON "WorkflowData"("userId", "storageKey");

-- CreateIndex
CREATE INDEX "ExecutionPhase_userId_startedAt_status_idx" ON "ExecutionPhase"("userId", "startedAt", "status");

-- CreateIndex
CREATE INDEX "UserPurchase_userId_date_idx" ON "UserPurchase"("userId", "date");

-- CreateIndex
CREATE INDEX "Workflow_userId_createdAt_idx" ON "Workflow"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Workflow_userId_status_idx" ON "Workflow"("userId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_userId_startedAt_idx" ON "WorkflowExecution"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");
