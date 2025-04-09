'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layers2Icon, Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CustomDialogHeader from '@/components/custom-dialog-header';

import { createWorkflow } from '@/actions/workflows/create-workflow';
import { createWorkflowSchema, createWorkflowSchemaType } from '@/schema/workflows';
import { TaskType } from '../../../../types/task'; // Changed to relative path

export default function CreateWorkflowDialog({ triggerText }: { triggerText?: string }) {
  const [open, setOpen] = useState(false);

  const form = useForm<createWorkflowSchemaType>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {},
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: createWorkflowSchemaType) => {
      const defaultNodeId = crypto.randomUUID();
      const defaultNode = {
        id: defaultNodeId,
        type: 'AIScrapeNode', // As per create-flow-node.ts
        dragHandle: '.drag-handle',
        data: {
          type: TaskType.LAUNCH_BROWSER, // Changed to LAUNCH_BROWSER
          inputs: {}, // LAUNCH_BROWSER typically has no direct inputs like a URL
        },
        position: { x: 50, y: 50 },
      };
      const defaultDefinition = JSON.stringify({
        nodes: [defaultNode],
        edges: [],
        viewport: null,
      });
      // The createWorkflow action expects (name, definition, description, shouldRedirect)
      // shouldRedirect defaults to true in the action if not provided.
      return createWorkflow(data.name, defaultDefinition, data.description);
    },
    onSuccess: () => {
      toast.success('Workflow created successfully', { id: 'create-workflow' });
    },
    onError: () => {
      toast.error('Failed to create workflow', { id: 'create-workflow' });
    },
  });

  const onSubmit = useCallback(
    (values: createWorkflowSchemaType) => {
      toast.loading('Creating workflow...', { id: 'create-workflow' });
      // `values` here is the object { name: string, description?: string }
      // The new mutationFn expects this object.
      mutate(values);
    },
    [mutate]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        form.reset();
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggerText ?? 'Create workflow'}</Button>
      </DialogTrigger>
      <DialogContent className="px-0">
        <CustomDialogHeader icon={Layers2Icon} title="Create workflow" subtitle="Start building your workflow" />
        <div className="px-6">
          <Form {...form}>
            <form className="space-y-8 w-full" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Name
                      <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Choose a description and unique name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Description
                      <p className="text-xs text-muted-foreground">(optional)</p>
                    </FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a brief description of what your workflow does.
                      <br /> This is optional but can help you remember the workflow&#39;s purpose.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : 'Proceed'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
