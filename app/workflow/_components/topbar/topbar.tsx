'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, MoreVerticalIcon, PanelLeftOpenIcon } from 'lucide-react'; // Added PanelLeftOpenIcon

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Added DropdownMenu components
import TooltipWrapper from '@/components/tooltip-wrapper';
import SaveBtn from '@/app/workflow/_components/topbar/save-btn';
import ExecuteBtn from '@/app/workflow/_components/topbar/execute-btn';
import PublishBtn from '@/app/workflow/_components/topbar/publish-btn';
import UnpublishBtn from '@/app/workflow/_components/topbar/unpublish-btn';
import NavigationTabs from '@/app/workflow/_components/topbar/navigation-tabs';

interface Props {
  onAutoLayout?: () => void;
  title: string;
  subtitle?: string;
  workflowId: string;
  hideButtons?: boolean;
  isPublished?: boolean;
  onToggleTaskMenuMobile?: () => void; // Added callback prop
}

export default function Topbar({
  title,
  subtitle,
  workflowId,
  hideButtons = false,
  isPublished = false,
  onToggleTaskMenuMobile,
}: Props) {
  const router = useRouter();

  return (
    <header className="flex p-2 border-b-2 border-separate justify-between items-center w-full h-[60px] sticky top-0 bg-background z-10"> {/* Added items-center */}
      <div className="flex gap-1 items-center flex-1"> {/* Added items-center */}
        {/* Mobile Task Menu Toggle */}
        {onToggleTaskMenuMobile && (
          <div className="block md:hidden mr-1">
            <TooltipWrapper content="Toggle Task Menu">
              <Button variant="ghost" size="icon" onClick={onToggleTaskMenuMobile}>
                <PanelLeftOpenIcon size={20} />
              </Button>
            </TooltipWrapper>
          </div>
        )}
        <TooltipWrapper content="Back">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeftIcon size={20} />
          </Button>
        </TooltipWrapper>
        <div className="overflow-hidden"> {/* Added overflow-hidden for better truncation */}
          <p className="font-bold text-ellipsis truncate">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate text-ellipsis">{subtitle}</p>}
        </div>
      </div>
      <NavigationTabs workflowId={workflowId} />
      <div className="flex gap-1 flex-1 justify-end">
        {/* Auto Layout button (desktop) */}
        {onAutoLayout && (
          <div className="hidden sm:flex mr-2">
            <TooltipWrapper content="Auto layout">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    onAutoLayout?.();
                  } catch (error) {
                    console.error('Error in onAutoLayout:', error);
                  }
                }}
              >
                Layout
              </Button>
            </TooltipWrapper>
          </div>
        )}
        {hideButtons === false && (
          <>
            {/* Desktop Buttons */}
            <div className="hidden sm:flex gap-1">
              <ExecuteBtn workflowId={workflowId} />
              {isPublished && <UnpublishBtn workflowId={workflowId} />}
              {!isPublished && (
                <>
                  <SaveBtn workflowId={workflowId} />
                  <PublishBtn workflowId={workflowId} />
                </>
              )}
            </div>
            {/* Mobile Dropdown for Actions */}
            <div className="block sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVerticalIcon size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <ExecuteBtn workflowId={workflowId} isMobile />
                  </DropdownMenuItem>
                  {isPublished && (
                    <DropdownMenuItem asChild>
                      <UnpublishBtn workflowId={workflowId} isMobile />
                    </DropdownMenuItem>
                  )}
                  {!isPublished && (
                    <>
                      <DropdownMenuItem asChild>
                        <SaveBtn workflowId={workflowId} isMobile />
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <PublishBtn workflowId={workflowId} isMobile />
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
