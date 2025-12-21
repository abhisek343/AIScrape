'use client';

import dynamic from 'next/dynamic'; // Re-added dynamic
import { usePathname } from 'next/navigation'; // Re-added usePathname
// Removed Link, Button, MessageSquareText for the link to /chatbot page
import Logo from '@/components/logo';
import { ModeToggle } from '@/components/thememode-toggle';
import { Separator } from '@/components/ui/separator';



export default function WorkflowLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChatbot = pathname.startsWith('/workflow/editor/');

  let workflowIdFromPath: string | undefined = undefined;
  if (showChatbot) {
    const pathSegments = pathname.split('/');
    // Expected path: /workflow/editor/[workflowId]
    // segments: ["", "workflow", "editor", "workflowIdValue"]
    if (pathSegments.length === 4 && pathSegments[1] === 'workflow' && pathSegments[2] === 'editor') {
      workflowIdFromPath = pathSegments[3];
    }
  }

  return (
    <div className="flex flex-col w-full h-auto min-h-[100svh]"> {/* Use safe viewport height for mobile */}
      {children}
      <Separator />
      <footer className="flex items-center justify-between p-2">
        <Logo href="/home" iconSize={16} fontSize="text-xl" />
        <ModeToggle />
      </footer>
    </div>
  );
}
