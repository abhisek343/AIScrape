import prisma from '@/lib/prisma';
import { submitWorkflowToQueue } from '@/lib/queue/workflow.queue';
import { GET } from './route';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    workflow: { findUnique: jest.fn(), updateMany: jest.fn() },
    workflowExecution: { count: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));
jest.mock('@/lib/queue/workflow.queue', () => ({ submitWorkflowToQueue: jest.fn() }));
jest.mock('@/lib/workflow/task/registry', () => ({
  TaskRegistry: { LAUNCH_BROWSER: { label: 'Launch Browser' } },
}));

const id = `c${'a'.repeat(24)}`;
const request = () => new Request(`http://localhost/api/workflows/execute?workflowId=${id}`, {
  headers: { authorization: 'Bearer a-long-local-cron-secret' },
});

beforeEach(() => {
  jest.resetAllMocks();
  process.env.API_SECRET = 'a-long-local-cron-secret';
  (prisma.workflow.findUnique as jest.Mock).mockResolvedValue({
    id, userId: 'user', status: 'PUBLISHED', cron: '0 * * * *',
    nextRunAt: new Date('2026-01-01T00:00:00.000Z'),
    executionPlan: JSON.stringify([{ phase: 1, nodes: [{ id: 'node', data: { type: 'LAUNCH_BROWSER' } }] }]),
    definition: JSON.stringify({ nodes: [], edges: [] }), creditsCost: 5,
  });
  (prisma.workflowExecution.count as jest.Mock).mockResolvedValue(0);
  (prisma.workflow.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  (prisma.workflowExecution.create as jest.Mock).mockResolvedValue({ id: 'execution-1' });
});

afterAll(() => { delete process.env.API_SECRET; });

it('rejects a request without the scheduler secret', async () => {
  const response = await GET(new Request(`http://localhost/api/workflows/execute?workflowId=${id}`));
  expect(response.status).toBe(401);
  expect(submitWorkflowToQueue).not.toHaveBeenCalled();
});

it('enqueues the persisted execution rather than running a browser in the web request', async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(submitWorkflowToQueue).toHaveBeenCalledWith(id, 'execution-1');
  expect(prisma.workflow.updateMany).toHaveBeenCalledTimes(1);
});

it('marks a failed enqueue and leaves the next scheduled time unchanged', async () => {
  (submitWorkflowToQueue as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));
  const response = await GET(request());
  expect(response.status).toBe(503);
  expect(prisma.workflowExecution.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'execution-1' },
    data: expect.objectContaining({ status: 'FAILED' }),
  }));
  expect(prisma.workflow.updateMany).toHaveBeenCalledTimes(2);
});

it('skips a scheduled occurrence that another scheduler already claimed', async () => {
  (prisma.workflow.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });

  const response = await GET(request());
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.skipped).toBe(true);
  expect(prisma.workflowExecution.create).not.toHaveBeenCalled();
  expect(submitWorkflowToQueue).not.toHaveBeenCalled();
});
