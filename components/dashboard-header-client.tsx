"use client";

import { useState, useEffect } from 'react';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { ModeToggle } from '@/components/thememode-toggle';

export function DashboardHeaderClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
