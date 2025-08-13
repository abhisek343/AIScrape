'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import { ChevronDown } from 'lucide-react'; // Added ChevronDown icon

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function NavigationTabs({ workflowId }: { workflowId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname?.split('/') || [];
  const activeValue = pathSegments.length > 2 ? pathSegments[2] : 'editor'; // Default to editor if path is unclear

  const navigate = (path: string) => {
    router.push(path);
  };

  const tabs = [
    { value: 'editor', label: 'Editor', href: `/workflow/editor/${workflowId}` },
    { value: 'runs', label: 'Runs', href: `/workflow/runs/${workflowId}` },
  ];

  const currentTab = tabs.find(tab => tab.value === activeValue) || tabs[0];

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <Tabs value={activeValue} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            {tabs.map((tab) => (
              <Link key={tab.value} href={tab.href} legacyBehavior passHref>
                <TabsTrigger value={tab.value} className="w-full">
                  {tab.label}
                </TabsTrigger>
              </Link>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile Dropdown */}
      <div className="block sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1 min-w-[120px] justify-between">
              <span>{currentTab.label}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-[150px]">
            {tabs.map((tab) => (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => navigate(tab.href)}
                className={activeValue === tab.value ? 'bg-accent' : ''}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
