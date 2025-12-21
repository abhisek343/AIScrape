import { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';

// Revalidate every 30 seconds for near-real-time data with caching
export const revalidate = 30;

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CreateWorkflowDialog from '@/app/(dashboard)/workflows/_components/create-workflow-dialog';
import WorkflowsList from '@/app/(dashboard)/workflows/_components/workflows-list';

import { getWorkflowsForUser } from '@/actions/workflows/get-workflows-for-user';

export default function WorkflowsPage() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Manage your workflows</p>
        </div>
        <CreateWorkflowDialog />
      </div>

      <div className="h-full py-6">
        <Suspense fallback={<UserWorkflowsSkeleton />}>
          <UserWorkflows />
        </Suspense>
      </div>
    </div>
  );
}

function UserWorkflowsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

async function UserWorkflows() {
  const workflows = await getWorkflowsForUser();

  if (!workflows) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong! Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return <WorkflowsList workflows={workflows} />;
}

