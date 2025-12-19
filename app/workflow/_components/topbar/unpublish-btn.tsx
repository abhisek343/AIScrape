'use client';

import { DownloadIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { unpublishWorkflow } from '@/actions/workflows/unpublish-workflow';

interface UnpublishBtnProps {
  workflowId: string;
  isMobile?: boolean;
}

export default function UnpublishBtn({ workflowId, isMobile = false }: UnpublishBtnProps) {
  const mutation = useMutation({
    mutationFn: unpublishWorkflow,
    onSuccess: () => {
      toast.success('Workflow unpublished', { id: workflowId });
    },
    onError: () => {
      toast.error('Something went wrong!', { id: workflowId });
    },
  });

  const handleClick = () => {
    toast.loading('Unpublishing workflow...', { id: workflowId });
    mutation.mutate(workflowId);
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
        <DownloadIcon size={16} className="stroke-orange-500" />
        <span>Unpublish</span>
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
      <DownloadIcon size={16} className="stroke-orange-500" />
      Unpublish
    </Button>
  );
}
