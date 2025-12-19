'use client';

import { useReactFlow } from '@xyflow/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { updateWorkflow } from '@/actions/workflows/update-workflow';

interface SaveBtnProps {
  workflowId: string;
  isMobile?: boolean;
}

export default function SaveBtn({ workflowId, isMobile = false }: SaveBtnProps) {
  const { toObject } = useReactFlow();

  const saveMutation = useMutation({
    mutationFn: updateWorkflow,
    onSuccess: () => {
      toast.success('Workflow saved successfully', { id: 'save-workflow' });
    },
    onError: () => {
      toast.error('Something went wrong!', { id: 'save-workflow' });
    },
  });

  const handleClick = () => {
    const workflowDefinition = JSON.stringify(toObject());
    toast.loading('Saving workflow...', { id: 'save-workflow' });
    saveMutation.mutate({
      id: workflowId,
      definition: workflowDefinition,
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
        aria-disabled={saveMutation.isPending}
      >
        <CheckIcon size={16} className="stroke-green-400" />
        <span>Save</span>
      </div>
    );
  }

  return (
    <Button
      disabled={saveMutation.isPending}
      variant="outline"
      className="flex items-center gap-2"
      onClick={handleClick}
    >
      <CheckIcon size={16} className="stroke-green-400" />
      Save
    </Button>
  );
}
