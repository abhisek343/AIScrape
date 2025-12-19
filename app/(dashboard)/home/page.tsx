import { Suspense } from 'react';
import { DollarSign, Zap, Workflow, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import StatsCard from './_components/stats-card';
import WorkflowGuides from './_components/workflow-guides';
import { Separator } from '@/components/ui/separator';
import { getDashboardStats } from '@/actions/analytics/get-stats';
import { getRecentWorkflows } from '@/actions/workflows/get-recent-workflows';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          A quick overview of your account and usage.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <Separator className="my-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Recent Workflows</h2>
          <Suspense fallback={<RecentWorkflowsSkeleton />}>
            <RecentWorkflows />
          </Suspense>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Guides & Resources</h2>
          <WorkflowGuides />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

async function StatsSection() {
  const stats = await getDashboardStats();
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Credits"
        value={stats.credits}
        icon={<CreditCard size={120} className="text-muted-foreground absolute -bottom-4 -right-8 stroke-primary opacity-10" />}
      />
      <StatsCard
        title="Workflows"
        value={stats.workflows}
        icon={<Workflow size={120} className="text-muted-foreground absolute -bottom-4 -right-8 stroke-primary opacity-10" />}
      />
      <StatsCard
        title="Executions"
        value={stats.executions}
        icon={<Zap size={120} className="text-muted-foreground absolute -bottom-4 -right-8 stroke-primary opacity-10" />}
      />
      <StatsCard
        title="Spent"
        value={stats.spent}
        icon={<DollarSign size={120} className="text-muted-foreground absolute -bottom-4 -right-8 stroke-primary opacity-10" />}
      />
    </div>
  );
}

function RecentWorkflowsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

async function RecentWorkflows() {
  const workflows = await getRecentWorkflows();

  if (workflows.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        No workflows found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workflows.map(workflow => (
        <Card key={workflow.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Link href={`/workflow/editor/${workflow.id}`} className="font-semibold hover:underline">
                  {workflow.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(workflow.updatedAt)} ago
                </span>
              </div>
              <Link href={`/workflow/editor/${workflow.id}`}>
                <Button size="sm" variant="ghost">
                  Edit <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      ))}
      <div className="flex justify-end pt-2">
        <Link href="/workflows">
          <Button variant="link" className="text-primary p-0">View All Workflows</Button>
        </Link>
      </div>
    </div>
  );
}
