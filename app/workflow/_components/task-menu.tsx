'use client';

import { CoinsIcon } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { TaskRegistry } from '@/lib/workflow/task/registry';
import { TaskType } from '@/types/task';

export default function TaskMenu() {
  return (
    // Removed fixed width classes. Width will be controlled by parent (SheetContent on mobile, wrapper div on desktop).
    <aside className="border-r-2 border-separate h-full p-2 px-4 overflow-auto">
      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={['extraction', 'interactions', 'timing', 'results', 'storage']}
      >
        <AccordionItem value="interactions">
          <AccordionTrigger className="font-bold">User interactions</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <TaskMenuBtn taskType={TaskType.NAVIGATE_URL} />
            <TaskMenuBtn taskType={TaskType.FILL_INPUT} />
            <TaskMenuBtn taskType={TaskType.CLICK_ELEMENT} />
            <TaskMenuBtn taskType={TaskType.SCROLL_TO_ELEMENT} />
            <TaskMenuBtn taskType={TaskType.HOVER_ELEMENT} />
            <TaskMenuBtn taskType={TaskType.KEYBOARD_TYPE} />
            <TaskMenuBtn taskType={TaskType.SET_VIEWPORT} />
            <TaskMenuBtn taskType={TaskType.SET_USER_AGENT} />
            <TaskMenuBtn taskType={TaskType.SET_COOKIES} />
            <TaskMenuBtn taskType={TaskType.SET_LOCAL_STORAGE} />
            <TaskMenuBtn taskType={TaskType.EVALUATE_JS} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="extraction">
          <AccordionTrigger className="font-bold">Data extraction</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <TaskMenuBtn taskType={TaskType.PAGE_TO_HTML} />
            <TaskMenuBtn taskType={TaskType.EXTRACT_TEXT_FROM_ELEMENT} />
            <TaskMenuBtn taskType={TaskType.EXTRACT_DATA_WITH_AI} />
            <TaskMenuBtn taskType={TaskType.EXTRACT_ATTRIBUTES} />
            <TaskMenuBtn taskType={TaskType.EXTRACT_LIST} />
            <TaskMenuBtn taskType={TaskType.REGEX_EXTRACT} />
            <TaskMenuBtn taskType={TaskType.SCREENSHOT} />
            <TaskMenuBtn taskType={TaskType.GENERATE_RANDOM_NUMBER} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="storage">
          <AccordionTrigger className="font-bold">Data storage</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <TaskMenuBtn taskType={TaskType.STORE_DATA} />
            <TaskMenuBtn taskType={TaskType.RETRIEVE_DATA} />
            <TaskMenuBtn taskType={TaskType.READ_PROPERTY_FROM_JSON} />
            <TaskMenuBtn taskType={TaskType.ADD_PROPERTY_TO_JSON} />
            <TaskMenuBtn taskType={TaskType.HTTP_REQUEST} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="timing">
          <AccordionTrigger className="font-bold">Timing controls</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <TaskMenuBtn taskType={TaskType.WAIT_FOR_ELEMENT} />
            <TaskMenuBtn taskType={TaskType.WAIT_FOR_NETWORK_IDLE} />
            <TaskMenuBtn taskType={TaskType.WAIT_FOR_NAVIGATION} />
            <TaskMenuBtn taskType={TaskType.INFINITE_SCROLL} />
            <TaskMenuBtn taskType={TaskType.DELAY} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="results">
          <AccordionTrigger className="font-bold">Result delivery</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <TaskMenuBtn taskType={TaskType.DISPLAY_DATA} />
            <TaskMenuBtn taskType={TaskType.DELIVER_VIA_WEBHOOK} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

function TaskMenuBtn({ taskType }: { taskType: TaskType }) {
  const task = TaskRegistry[taskType];

  const onDragStart = (e: React.DragEvent, type: TaskType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Button
      variant="secondary"
      className="flex justify-between items-center gap-2 border w-full"
      draggable
      onDragStart={(e) => onDragStart(e, taskType)}
    >
      <div className="flex items-center gap-2">
        <task.icon size={20} />
        {task.label}
      </div>
      <Badge className="gap-2 flex items-center" variant="outline">
        <CoinsIcon size={16} />
        {task.credits}
      </Badge>
    </Button>
  );
}
