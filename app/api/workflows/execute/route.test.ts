import prisma from '@/lib/prisma';
import { submitWorkflowToQueue } from '@/lib/queue/workflow.queue';
import { GET } from './route';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    workflow: { findUnique: jest.fn(), update: jest.fn() },
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
    executionPlan: JSON.stringify([{ phase: 1, nodes: [{ id: 'node', data: { type: 'LAUNCH_BROWSER' } }] }]),
    definition: JSON.stringify({ nodes: [], edges: [] }), creditsCost: 5,
  });
  (prisma.workflowExecution.count as jest.Mock).mockResolvedValue(0);
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
  expect(prisma.workflow.update).toHaveBeenCalledTimes(1);
});

it('marks a failed enqueue and leaves the next scheduled time unchanged', async () => {
  (submitWorkflowToQueue as jest.Mock).mockRejectedValue(new Error('Redis unavailable'));
  const response = await GET(request());
  expect(response.status).toBe(503);
  expect(prisma.workflowExecution.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'execution-1' },
    data: expect.objectContaining({ status: 'FAILED' }),
  }));
  expect(prisma.workflow.update).not.toHaveBeenCalled();
});
