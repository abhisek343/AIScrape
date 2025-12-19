'use client';

import { useState, useTransition } from 'react';
import { Trash2Icon, XIcon, CheckSquareIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { deleteWorkflows } from '@/actions/workflows/delete-workflows';

interface BulkActionsBarProps {
    selectedIds: Set<string>;
    totalCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDeleteComplete: () => void;
}

export default function BulkActionsBar({
    selectedIds,
    totalCount,
    onSelectAll,
    onDeselectAll,
    onDeleteComplete,
}: BulkActionsBarProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isPending, startTransition] = useTransition();

    const selectedCount = selectedIds.size;
    const allSelected = selectedCount === totalCount && totalCount > 0;

    if (selectedCount === 0) {
        return null;
    }

    const handleDelete = () => {
        startTransition(async () => {
            try {
                toast.loading(`Deleting ${selectedCount} workflow(s)...`, { id: 'bulk-delete' });
                await deleteWorkflows(Array.from(selectedIds));
                toast.success(`Successfully deleted ${selectedCount} workflow(s)`, { id: 'bulk-delete' });
                onDeleteComplete();
            } catch (error) {
                toast.error('Failed to delete workflows', { id: 'bulk-delete' });
                console.error('Bulk delete error:', error);
            }
        });
    };

    return (
        <>
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedCount} Workflow(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected workflows
                            and all associated executions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={allSelected ? onDeselectAll : onSelectAll}
                    className="flex items-center gap-2"
                >
                    <CheckSquareIcon size={16} />
                    {allSelected ? 'Deselect All' : 'Select All'}
                </Button>

                <span className="text-sm text-muted-foreground font-medium">
                    {selectedCount} of {totalCount} selected
                </span>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeselectAll}
                    className="flex items-center gap-2"
                >
                    <XIcon size={16} />
                    Cancel
                </Button>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isPending}
                    className="flex items-center gap-2"
                >
                    <Trash2Icon size={16} />
                    Delete Selected
                </Button>
            </div>
        </>
    );
}
