import { Suspense } from 'react';
import { Loader2Icon } from 'lucide-react';

import Topbar from '@/app/workflow/_components/topbar/topbar';
import ExecutionViewer from '@/app/workflow/runs/[workflowId]/[executionId]/_components/execution-viewer';

import { getWorkflowExecutionWithPhases } from '@/actions/workflows/get-workflow-execution-with-phases';

export default async function ExecutionViewerPage({
  params,
}: {
  params: Promise<{
    executionId: string;
    workflowId: string;
  }>;
}) {
  const { workflowId, executionId } = await params;
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Topbar
        workflowId={workflowId}
        title="Workflow run details"
        subtitle={`Run ID: ${executionId}`}
        hideButtons
      />
      <section className="flex h-full overflow-auto">
        <Suspense
          fallback={
            <div className="flex w-full items-center justify-center">
              <Loader2Icon className="h-10 w-10 animate-spin stroke-primary" />
            </div>
          }
        >
          <ExecutionViewerWrapper executionId={executionId} />
        </Suspense>
      </section>
    </div>
  );
}

async function ExecutionViewerWrapper({ executionId }: { executionId: string }) {
  const workflowExecution = await getWorkflowExecutionWithPhases(executionId);

  if (!workflowExecution) {
    return <div>Not found</div>;
  }

  return <ExecutionViewer initialData={workflowExecution} />;
}
