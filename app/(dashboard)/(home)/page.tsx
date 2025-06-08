'use client';

import { DollarSign, Zap, Workflow, CreditCard } from 'lucide-react';

import StatsCard from './_components/stats-card';
import { Separator } from '@/components/ui/separator';
import BreadcrumbHeader from '@/components/breadcrumb-header';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          A quick overview of your account and usage.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Credits"
          value={100}
          icon={CreditCard}
        />
        <StatsCard
          title="Workflows"
          value={5}
          icon={Workflow}
        />
        <StatsCard
          title="Executions"
          value={120}
          icon={Zap}
        />
        <StatsCard
          title="Spent"
          value={50}
          icon={DollarSign}
        />
      </div>
      <Separator className="my-6" />
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p>No recent activity to display.</p>
      </div>
    </div>
  );
}
