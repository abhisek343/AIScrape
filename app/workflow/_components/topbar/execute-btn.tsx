'use client';

import { PlayIcon } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { runWorkflow } from '@/actions/workflows/run-workflow';
import useExecutionPlan from '@/hooks/use-execution-plan';

interface ExecuteBtnProps {
  workflowId: string;
  isMobile?: boolean;
}

export default function ExecuteBtn({ workflowId, isMobile = false }: ExecuteBtnProps) {
  const router = useRouter();
  const generate = useExecutionPlan();
  const { toObject } = useReactFlow();

  const mutation = useMutation({
    mutationFn: runWorkflow,
    onSuccess: (exec) => {
      toast.success('Execution started', { id: 'flow-execution' });
      router.push(`/workflow/runs/${exec.workflowId}/${exec.id}`);
    },
    onError: () => {
      toast.error('Something went wrong!', { id: 'flow-execution' });
    },
  });

  const handleClick = () => {
    // Get the current flow state FIRST, before validation might trigger re-renders affecting it.
    const currentFlowStateForExecution = toObject();

    const plan = generate(); // This will run client-side validation and display errors if any
    if (!plan) {
      // Validation failed, errors are now set by generate(), so just return.
      return;
    }

    // If validation passed, proceed with mutation using the initially captured state.
    mutation.mutate({
      workflowId: workflowId,
      currentFlowDefinition: JSON.stringify(currentFlowStateForExecution),
    });
  };

  if (isMobile) {
    return (
      <div
        onClick={handleClick}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-disabled={mutation.isPending}
      >
        <PlayIcon size={16} className="stroke-orange-400" />
        <span>Execute</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="flex items-center gap-2"
      disabled={mutation.isPending}
      onClick={handleClick}
    >
      <PlayIcon size={16} className="stroke-orange-400" />
      Execute
    </Button>
  );
}
