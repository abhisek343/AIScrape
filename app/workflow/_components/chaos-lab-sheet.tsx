'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edge, useReactFlow } from '@xyflow/react';
import {
  CopyIcon,
  FlaskConicalIcon,
  GaugeIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  TimerIcon,
  TriangleAlertIcon,
  ZapIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  analyzeWorkflowChaos,
  ChaosAutoFix,
  formatChaosLabSummary,
  WorkflowChaosReport,
} from '@/lib/workflow/chaos-lab';
import { createFlowNode } from '@/lib/workflow/create-flow-node';
import { AppNode } from '@/types/appnode';
import { TaskType } from '@/types/task';

type FlowStateGetter = (() => { nodes: any[]; edges: any[]; viewport: any } | undefined) | undefined;

function getScoreTone(score: number): string {
  if (score >= 85) return 'text-emerald-500';
  if (score >= 70) return 'text-yellow-500';
  return 'text-red-500';
}

function getIssueBadgeClass(level: 'low' | 'medium' | 'high'): string {
  if (level === 'high') return 'border-red-500 text-red-500';
  if (level === 'medium') return 'border-yellow-500 text-yellow-500';
  return 'border-emerald-500 text-emerald-500';
}

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

export default function ChaosLabSheet({
  open,
  onOpenChange,
  workflowName,
  getFlowState,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowName: string;
  getFlowState: FlowStateGetter;
}) {
  const [report, setReport] = useState<WorkflowChaosReport | null>(null);
  const { toObject, setNodes, setEdges } = useReactFlow();

  const refresh = useCallback(() => {
    const state = getFlowState?.();
    if (!state) {
      setReport(null);
      return;
    }

    const nextReport = analyzeWorkflowChaos(state.nodes as AppNode[], state.edges as Edge[]);
    setReport(nextReport);
  }, [getFlowState]);

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  const handleCopySummary = useCallback(async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(formatChaosLabSummary(report));
      toast.success('Chaos Lab summary copied');
    } catch {
      toast.error('Failed to copy summary');
    }
  }, [report]);

  const applyWaitGuardFix = useCallback(() => {
    const flowState = toObject();
    const nodes = (flowState.nodes ?? []) as AppNode[];
    const edges = (flowState.edges ?? []) as Edge[];

    if (nodes.length === 0 || edges.length === 0) {
      toast.error('No fixable browser path found');
      return false;
    }

    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const candidateEdge = edges.find((edge) => {
      if (edge.sourceHandle !== 'Web page' || edge.targetHandle !== 'Web page') {
        return false;
      }

      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) {
        return false;
      }

      if (sourceNode.data.type === TaskType.WAIT_FOR_NETWORK_IDLE) {
        return false;
      }

      if (targetNode.data.type === TaskType.WAIT_FOR_NETWORK_IDLE) {
        return false;
      }

      return true;
    });

    if (!candidateEdge) {
      toast.error('No guard insertion point available');
      return false;
    }

    const sourceNode = nodeMap.get(candidateEdge.source)!;
    const targetNode = nodeMap.get(candidateEdge.target)!;
    const guardNode = createFlowNode(TaskType.WAIT_FOR_NETWORK_IDLE, {
      x: (sourceNode.position.x + targetNode.position.x) / 2,
      y: (sourceNode.position.y + targetNode.position.y) / 2 + 100,
    });
    guardNode.data.inputs = { ...guardNode.data.inputs, 'Timeout (ms)': '8000' };

    const guardIncoming: Edge = {
      id: crypto.randomUUID(),
      source: candidateEdge.source,
      sourceHandle: candidateEdge.sourceHandle,
      target: guardNode.id,
      targetHandle: 'Web page',
      animated: true,
      type: candidateEdge.type ?? 'smoothstep',
    };

    const guardOutgoing: Edge = {
      id: crypto.randomUUID(),
      source: guardNode.id,
      sourceHandle: 'Web page',
      target: candidateEdge.target,
      targetHandle: candidateEdge.targetHandle,
      animated: true,
      type: candidateEdge.type ?? 'smoothstep',
    };

    setNodes([...nodes, guardNode]);
    setEdges(edges.filter((edge) => edge.id !== candidateEdge.id).concat(guardIncoming, guardOutgoing));
    toast.success('Inserted WAIT_FOR_NETWORK_IDLE guard');
    return true;
  }, [setEdges, setNodes, toObject]);

  const handleAutoFix = useCallback(
    (autoFix: ChaosAutoFix) => {
      let applied = false;

      if (autoFix === 'ADD_WAIT_GUARD') {
        applied = applyWaitGuardFix();
      }

      if (applied) {
        setTimeout(() => refresh(), 120);
      }
    },
    [applyWaitGuardFix, refresh]
  );

  const recommendedAutoFix = report?.issues.find((issue) => issue.autoFix)?.autoFix;

  const topIssues = report?.issues.slice(0, 5) ?? [];
  const topRisks = report?.nodeRisks.slice(0, 5) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-none sm:max-w-2xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <FlaskConicalIcon size={18} className="text-cyan-500" />
                  Chaos Lab
                </SheetTitle>
                <SheetDescription>
                  Live resilience simulation for <span className="font-medium">{workflowName}</span>
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCcwIcon size={14} className="mr-1" />
                  Re-run
                </Button>
                {recommendedAutoFix && (
                  <Button variant="outline" size="sm" onClick={() => handleAutoFix(recommendedAutoFix)}>
                    <ZapIcon size={14} className="mr-1 text-amber-500" />
                    Auto-fix
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCopySummary} disabled={!report}>
                  <CopyIcon size={14} className="mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!report && (
              <Card>
                <CardHeader>
                  <CardTitle>No flow state available</CardTitle>
                  <CardDescription>
                    Move a node or reconnect the editor, then re-open Chaos Lab.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {report && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Overall Quality Score</CardDescription>
                    <CardTitle className={`text-4xl ${getScoreTone(report.metrics.overallScore)}`}>
                      {report.metrics.overallScore}
                      <span className="text-base text-muted-foreground ml-1">/100</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="rounded border p-2">
                      <div className="text-muted-foreground">Resilience</div>
                      <div className="font-semibold">{report.metrics.resilienceScore}/100</div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-muted-foreground">Maintainability</div>
                      <div className="font-semibold">{report.metrics.maintainabilityScore}/100</div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-muted-foreground">Complexity</div>
                      <div className="font-semibold">{report.metrics.complexityScore}/100</div>
                    </div>
                    <div className="rounded border p-2">
                      <div className="text-muted-foreground">Flow fingerprint</div>
                      <div className="font-mono text-[11px]">{report.fingerprint}</div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <ShieldCheckIcon size={14} />
                        Predicted Success
                      </CardDescription>
                      <CardTitle className={getScoreTone(report.metrics.predictedSuccessRate)}>
                        {report.metrics.predictedSuccessRate.toFixed(1)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Based on {report.simulationRuns} chaos simulations.
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <TimerIcon size={14} />
                        P95 Runtime
                      </CardDescription>
                      <CardTitle>{formatMs(report.metrics.p95DurationMs)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      P50 runtime: {formatMs(report.metrics.p50DurationMs)}.
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1">
                        <ZapIcon size={14} />
                        Credits Per Run
                      </CardDescription>
                      <CardTitle>{report.metrics.estimatedCreditsPerRun}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      {report.metrics.nodeCount} nodes, {report.metrics.phaseCount} phases.
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GaugeIcon size={16} />
                      Bottlenecks
                    </CardTitle>
                    <CardDescription>Slowest average nodes in simulated executions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {report.bottlenecks.length === 0 && (
                      <p className="text-sm text-muted-foreground">No bottlenecks detected yet.</p>
                    )}
                    {report.bottlenecks.map((item, index) => (
                      <div key={item.nodeId} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">
                            {index + 1}. {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.nodeId}</p>
                        </div>
                        <p className="font-semibold">{formatMs(item.avgDurationMs)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TriangleAlertIcon size={16} />
                      Priority Fixes
                    </CardTitle>
                    <CardDescription>Highest-impact risks and how to mitigate them.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topIssues.length === 0 && (
                      <p className="text-sm text-muted-foreground">No critical issues detected.</p>
                    )}
                    {topIssues.map((issue) => (
                      <div key={issue.id} className="rounded border px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{issue.title}</p>
                          <div className="flex items-center gap-2">
                            {issue.autoFix && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleAutoFix(issue.autoFix!)}
                              >
                                Apply fix
                              </Button>
                            )}
                            <Badge variant="outline" className={getIssueBadgeClass(issue.level)}>
                              {issue.level}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{issue.details}</p>
                        <p className="text-xs mt-2">
                          <span className="font-medium">Fix:</span> {issue.fix}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Most Fragile Nodes</CardTitle>
                    <CardDescription>Estimated failure probability by node.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topRisks.length === 0 && (
                      <p className="text-sm text-muted-foreground">No node risk data available.</p>
                    )}
                    {topRisks.map((risk) => (
                      <div key={risk.nodeId} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{risk.label}</p>
                          <p className="text-xs text-muted-foreground">{risk.type}</p>
                        </div>
                        <p className={getScoreTone(100 - risk.failureProbability * 100)}>
                          {(risk.failureProbability * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
