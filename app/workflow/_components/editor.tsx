'use client';

import { useRef, useState, useCallback } from 'react';
import { Workflow } from '@prisma/client';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import dynamic from 'next/dynamic';

import FlowEditor from '@/app/workflow/_components/flow-editor';
import Topbar from '@/app/workflow/_components/topbar/topbar';
import TaskMenu from '@/app/workflow/_components/task-menu';
import { FlowValidationContextProvider } from '@/components/context/flow-validation-context';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { WorkflowStatus } from '@/types/workflow';

import { ChatbotWidget } from '@/components/chatbot/chatbot-widget';

// ... imports

/** Wrapper component NO LONGER NEEDED - State is lifted from FlowEditor */
// function ChatbotWithFlowState(...) { ... }

export default function Editor({ workflow }: { workflow: Workflow }) {
  const autoLayout = useRef<null | (() => void)>(null);
  const [isTaskMenuOpenMobile, setIsTaskMenuOpenMobile] = useState(false);

  // State to hold the getFlowState function provided by FlowEditor
  const [getFlowState, setGetFlowState] = useState<(() => { nodes: any[]; edges: any[]; viewport: any } | undefined) | undefined>(undefined);

  return (
    <>
      <FlowValidationContextProvider>
        <ReactFlowProvider>
          <div className="flex flex-col h-full w-full overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
            <Topbar
              title="Workflow editor"
              subtitle={workflow.name}
              workflowId={workflow.id}
              isPublished={workflow.status === WorkflowStatus.PUBLISHED}
              onToggleTaskMenuMobile={() => setIsTaskMenuOpenMobile((prev) => !prev)}
              onAutoLayout={() => {
                if (autoLayout.current) {
                  autoLayout.current();
                }
              }}
            />
            <section className="flex h-full overflow-hidden flex-col md:flex-row"> {/* Stack on mobile, row on desktop */}
              {/* Desktop Task Menu */}
              <div className="hidden md:block h-full overflow-auto w-80 min-w-80"> {/* Added wrapper for desktop with fixed width */}
                <TaskMenu />
              </div>

              {/* Mobile Task Menu in a Sheet */}
              <div className="block md:hidden">
                <Sheet open={isTaskMenuOpenMobile} onOpenChange={setIsTaskMenuOpenMobile}>
                  <SheetContent side="left" className="w-[85vw] max-w-xs sm:w-[300px] p-0 overflow-auto"> {/* Responsive width on mobile */}
                    <TaskMenu />
                  </SheetContent>
                </Sheet>
              </div>

              <div className="flex-1 h-full overflow-auto" style={{ height: '100%', width: '100%' }}> {/* Wrapper for FlowEditor to take remaining space and scroll */}
                <FlowEditor
                  workflow={workflow}
                  registerAutoLayout={(fn) => (autoLayout.current = fn as any)}
                  onGetState={setGetFlowState as any}
                />
              </div>
            </section>
          </div>
          {/* Render ChatbotWidget directly - getFlowState is now safe from state */}
          <ChatbotWidget
            workflowId={workflow.id}
            onAutoLayout={() => {
              if (autoLayout.current) {
                autoLayout.current();
              }
            }}
            getFlowState={getFlowState as any}
          />
        </ReactFlowProvider>
      </FlowValidationContextProvider>
    </>
  );
}
