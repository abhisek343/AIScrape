'use client';

import { useState, useCallback } from 'react';
import { Workflow } from '@prisma/client';
import { InboxIcon, CheckSquareIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import WorkflowCard from '@/app/(dashboard)/workflows/_components/workflow-card';
import CreateWorkflowDialog from '@/app/(dashboard)/workflows/_components/create-workflow-dialog';
import BulkActionsBar from '@/app/(dashboard)/workflows/_components/bulk-actions-bar';

// The workflow type from getWorkflowsForUser (without definition field)
type WorkflowListItem = Omit<Workflow, 'definition' | 'executionPlan'>;

interface WorkflowsListProps {
    workflows: WorkflowListItem[];
}

export default function WorkflowsList({ workflows }: WorkflowsListProps) {
    const router = useRouter();
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedIds(new Set(workflows.map((w) => w.id)));
    }, [workflows]);

    const handleDeselectAll = useCallback(() => {
        setSelectedIds(new Set());
        setIsSelectMode(false);
    }, []);

    const handleDeleteComplete = useCallback(() => {
        setSelectedIds(new Set());
        setIsSelectMode(false);
        router.refresh();
    }, [router]);

    const toggleSelectMode = () => {
        if (isSelectMode) {
            // Exiting select mode, clear selection
            setSelectedIds(new Set());
        }
        setIsSelectMode(!isSelectMode);
    };

    if (workflows.length === 0) {
        return (
            <div className="flex flex-col gap-4 h-full items-center justify-center">
                <div className="rounded-full bg-accent w-20 h-20 flex items-center justify-center">
                    <InboxIcon size={40} className="stroke-primary" />
                </div>
                <div className="flex flex-col gap-1 text-center">
                    <p className="font-bold">No workflow created yet</p>
                    <p className="text-sm text-muted-foreground">Click the button below to create your first workflow</p>
                </div>
                <CreateWorkflowDialog triggerText="Create your first workflow" />
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button
                    variant={isSelectMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleSelectMode}
                    className="flex items-center gap-2"
                >
                    {isSelectMode ? (
                        <>
                            <XIcon size={16} />
                            Cancel
                        </>
                    ) : (
                        <>
                            <CheckSquareIcon size={16} />
                            Select
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {workflows.map((workflow) => (
                    <WorkflowCard
                        key={workflow.id}
                        workflow={workflow as Workflow}
                        isSelectMode={isSelectMode}
                        isSelected={selectedIds.has(workflow.id)}
                        onToggleSelect={handleToggleSelect}
                    />
                ))}
            </div>

            <BulkActionsBar
                selectedIds={selectedIds}
                totalCount={workflows.length}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onDeleteComplete={handleDeleteComplete}
            />
        </>
    );
}
