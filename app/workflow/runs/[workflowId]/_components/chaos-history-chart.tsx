'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { FlaskConicalIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import { getWorkflowExecutions } from '@/actions/workflows/get-workflow-executions';

type ExecutionRows = Awaited<ReturnType<typeof getWorkflowExecutions>>;
type ExecutionRow = NonNullable<ExecutionRows>[number];

const chartConfig = {
  score: {
    label: 'Chaos Score',
    color: 'hsl(var(--chart-2))',
  },
  success: {
    label: 'Predicted Success %',
    color: 'hsl(var(--chart-4))',
  },
};

function toDateLabel(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChaosHistoryChart({ executions }: { executions: ExecutionRows }) {
  const rows = (executions ?? []) as ExecutionRow[];

  const data = rows
    .slice(0, 24)
    .reverse()
    .map((execution, index) => ({
      run: index + 1,
      label: toDateLabel(execution.startedAt ?? execution.createdAt),
      score: execution.chaosScore ?? null,
      success: execution.chaosPredictedSuccess ?? null,
    }))
    .filter((row) => row.score !== null || row.success !== null);

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const scoreDelta =
    latest && previous && typeof latest.score === 'number' && typeof previous.score === 'number'
      ? latest.score - previous.score
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <FlaskConicalIcon className="w-6 h-6 text-cyan-500" />
          Chaos Lab Trend
        </CardTitle>
        <CardDescription>
          Snapshot history across recent runs {scoreDelta !== null && `(Δ ${scoreDelta >= 0 ? '+' : ''}${scoreDelta})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No Chaos snapshots yet. Trigger a run to generate the first snapshot.
          </p>
        )}
        {data.length > 0 && (
          <ChartContainer config={chartConfig} className="max-h-[240px] w-full">
            <LineChart data={data} height={220} accessibilityLayer margin={{ top: 16, right: 12, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
              <YAxis
                yAxisId="score"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={30}
              />
              <YAxis
                yAxisId="success"
                orientation="right"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={30}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <ChartTooltip content={<ChartTooltipContent className="w-[240px]" />} />
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="score"
                stroke="var(--color-score)"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
              <Line
                yAxisId="success"
                type="monotone"
                dataKey="success"
                stroke="var(--color-success)"
                strokeWidth={2}
                dot={{ r: 2 }}
                strokeDasharray="4 3"
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
