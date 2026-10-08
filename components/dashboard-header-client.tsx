"use client";

import { SignedIn, UserButton } from '@clerk/nextjs';
import { ModeToggle } from '@/components/thememode-toggle';
import { useHydrated } from '@/hooks/use-hydrated';

export function DashboardHeaderClient() {
  const isMounted = useHydrated();

  return (
    <div className="gap-1 flex items-center">
      <ModeToggle />
      {isMounted && (
        <SignedIn>
          <UserButton />
        </SignedIn>
      )}
    </div>
  );
}
