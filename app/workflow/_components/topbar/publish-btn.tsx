'use client';

import { UploadIcon } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { publishWorkflow } from '@/actions/workflows/publish-workflow';
import useExecutionPlan from '@/hooks/use-execution-plan';

interface PublishBtnProps {
  workflowId: string;
  isMobile?: boolean;
}

export default function PublishBtn({ workflowId, isMobile = false }: PublishBtnProps) {
  const generate = useExecutionPlan();
  const { toObject } = useReactFlow();

  const mutation = useMutation({
    mutationFn: publishWorkflow,
    onSuccess: () => {
      toast.success('Workflow published', { id: workflowId });
    },
    onError: () => {
      toast.error('Something went wrong!', { id: workflowId });
    },
  });

  const handleClick = () => {
    const plan = generate();
    if (!plan) {
      // Client side validation
      return;
    }

    toast.loading('Publishing workflow...', { id: workflowId });
    mutation.mutate({
      id: workflowId,
      flowDefinition: JSON.stringify(toObject()),
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
        <UploadIcon size={16} className="stroke-green-400" />
        <span>Publish</span>
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
      <UploadIcon size={16} className="stroke-green-400" />
      Publish
    </Button>
  );
}
