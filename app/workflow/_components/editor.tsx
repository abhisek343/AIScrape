'use client';

import { useState } from 'react'; // Added useState
import { Workflow } from '@prisma/client';
import { ReactFlowProvider } from '@xyflow/react';

import FlowEditor from '@/app/workflow/_components/flow-editor';
import Topbar from '@/app/workflow/_components/topbar/topbar';
import TaskMenu from '@/app/workflow/_components/task-menu';
import { FlowValidationContextProvider } from '@/components/context/flow-validation-context';
import { Sheet, SheetContent } from '@/components/ui/sheet'; // Added Sheet components

import { WorkflowStatus } from '@/types/workflow';

export default function Editor({ workflow }: { workflow: Workflow }) {
  const [isTaskMenuOpenMobile, setIsTaskMenuOpenMobile] = useState(false);

  return (
    <FlowValidationContextProvider>
      <ReactFlowProvider>
        <div className="flex flex-col h-full w-full overflow-hidden">
          <Topbar
            title="Workflow editor"
            subtitle={workflow.name}
            workflowId={workflow.id}
            isPublished={workflow.status === WorkflowStatus.PUBLISHED}
            onToggleTaskMenuMobile={() => setIsTaskMenuOpenMobile((prev) => !prev)} // Added prop
          />
          <section className="flex h-full overflow-hidden"> {/* Changed overflow-auto to overflow-hidden on parent */}
            {/* Desktop Task Menu */}
            <div className="hidden md:block h-full overflow-auto"> {/* Added wrapper for desktop */}
              <TaskMenu />
            </div>

            {/* Mobile Task Menu in a Sheet */}
            <div className="block md:hidden">
              <Sheet open={isTaskMenuOpenMobile} onOpenChange={setIsTaskMenuOpenMobile}>
                <SheetContent side="left" className="w-[300px] p-0 overflow-auto"> {/* Adjusted width and padding */}
                  <TaskMenu />
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="flex-1 h-full overflow-auto"> {/* Wrapper for FlowEditor to take remaining space and scroll */}
              <FlowEditor workflow={workflow} />
            </div>
          </section>
        </div>
      </ReactFlowProvider>
    </FlowValidationContextProvider>
  );
}
