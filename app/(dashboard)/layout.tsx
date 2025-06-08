// Removed 'use client', dynamic, usePathname imports as they are no longer needed here for the chatbot.

import { Separator } from '@/components/ui/separator';
import { DesktopSidebar, MobileSidebar } from '@/components/sidebar';
import BreadcrumbHeader from '@/components/breadcrumb-header';
import { DashboardHeaderClient } from '@/components/dashboard-header-client';

// ChatbotWidget is no longer rendered from this layout.

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Removed pathname and showChatbot logic.

  return (
    <div className="flex h-screen">
      <DesktopSidebar />
      <div className="flex flex-col flex-1 min-h-screen">
        <header className="flex items-center justify-between px-6 py-4 h-[50px] container">
          <MobileSidebar />
          <BreadcrumbHeader />
          <DashboardHeaderClient />
        </header>
        <Separator />
        <div className="overflow-auto">
          <div className="flex-1 container py-4 text-accent-foreground">{children}</div>
        </div>
      </div>
      {/* ChatbotWidget rendering removed from here */}
    </div>
  );
}
