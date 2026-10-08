import prisma from '@/lib/prisma';
import { WorkflowExecutionStatus } from '@/types/workflow';

const POLL_INTERVAL_MS = 800;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForExecutionAndSummarize(
  executionId: string,
  timeoutMs = 8_000,
) {
  const startedAt = Date.now();
  const maxIterations = Math.ceil(timeoutMs / POLL_INTERVAL_MS);
  const terminalStates = [
    WorkflowExecutionStatus.COMPLETED,
    WorkflowExecutionStatus.FAILED,
  ];

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        phases: { orderBy: { number: 'asc' }, include: { logs: true } },
      },
    });

    if (!execution) {
      return { status: 'NOT_FOUND', summary: 'Execution not found.' } as const;
    }

    if (terminalStates.includes(execution.status as WorkflowExecutionStatus)) {
      const outputs = execution.phases.map((
        phase: { outputs: string | null; name: string },
        index: number,
      ) => {
        let parsedOutput: Record<string, unknown> = {};
        try {
          parsedOutput = phase.outputs ? JSON.parse(phase.outputs) : {};
        } catch {
          parsedOutput = {};
        }

        return {
          phase: index + 1,
          name: phase.name,
          outputs: parsedOutput,
        };
      });

      const last = outputs.at(-1);
      const lastOutputSummary = last && Object.keys(last.outputs).length > 0
        ? JSON.stringify(last.outputs)
        : '(no outputs)';
      const overall =
        `Run ${String(execution.status).toLowerCase()}. Credits consumed: ${execution.creditsConsumed}.`;
      const phases = outputs
        .map((phase: { phase: number; name: string; outputs: Record<string, unknown> }) =>
          `Phase ${phase.phase} - ${phase.name}: ${JSON.stringify(phase.outputs) || '{}'}`,
        )
        .join('\n');

      return {
        status: execution.status,
        summary: `${overall}\nLast phase outputs: ${lastOutputSummary}\n\nAll phase outputs:\n${phases}`,
      } as const;
    }

    if (Date.now() - startedAt > timeoutMs) {
      break;
    }

    await wait(POLL_INTERVAL_MS);
  }

  return {
    status: 'TIMEOUT',
    summary: 'The run is still in progress. Check runs page for live status.',
  } as const;
}
