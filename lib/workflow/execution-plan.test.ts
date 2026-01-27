import { flowToExecutionPlan } from '@/lib/workflow/execution-plan';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { AppNode } from '@/types/appnode';
import { Edge } from '@xyflow/react';
import { TaskType } from '@/types/task';

// Mock registry to ensure we have controlled task definitions
jest.mock('@/lib/workflow/task/registry', () => ({
    TaskRegistry: {
        LAUNCH_BROWSER: {
            type: 'LAUNCH_BROWSER',
            label: 'Launch Browser',
            isEntryPoint: true,
            inputs: [{ name: 'url', type: 'STRING', required: true }],
            credits: 5
        },
        PAGE_TO_HTML: {
            type: 'PAGE_TO_HTML',
            label: 'Page to HTML',
            isEntryPoint: false,
            inputs: [{ name: 'html', type: 'STRING', required: true }],
            credits: 2
        },
        EXTRACT_TEXT_FROM_ELEMENT: {
            type: 'EXTRACT_TEXT_FROM_ELEMENT',
            label: 'Extract Text',
            isEntryPoint: false,
            inputs: [{ name: 'html', type: 'STRING', required: true }, { name: 'selector', type: 'STRING', required: true }],
            credits: 2
        },
        // Add a specialized task for testing parallel execution grouping
        PARALLEL_TASK: {
            type: 'PARALLEL_TASK',
            label: 'Parallel Task',
            isEntryPoint: false,
            inputs: [{ name: 'trigger', type: 'STRING', required: false }],
            credits: 1
        }
    }
}));

describe('flowToExecutionPlan', () => {
    it('should generate a valid plan for a simple linear flow', () => {
        const nodes: AppNode[] = [
            {
                id: '1',
                position: { x: 0, y: 0 },
                data: { type: 'LAUNCH_BROWSER' as TaskType, inputs: { url: 'https://example.com' } }
            },
            {
                id: '2',
                position: { x: 100, y: 0 },
                data: { type: 'PAGE_TO_HTML' as TaskType, inputs: {} }
            }
        ];

        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2', sourceHandle: 'webPage', targetHandle: 'html' }
        ];

        const { executionPlan, error } = flowToExecutionPlan(nodes, edges);

        expect(error).toBeUndefined();
        expect(executionPlan).toBeDefined();
        expect(executionPlan?.length).toBe(2);
        expect(executionPlan?.[0].nodes[0].id).toBe('1');
        expect(executionPlan?.[1].nodes[0].id).toBe('2');
    });

    it('should fail if required inputs are missing', () => {
        const nodes: AppNode[] = [
            {
                id: '1',
                position: { x: 0, y: 0 },
                data: { type: 'LAUNCH_BROWSER' as TaskType, inputs: { /* Missing URL */ } }
            }
        ];

        const { executionPlan, error } = flowToExecutionPlan(nodes, []);

        expect(executionPlan).toBeUndefined();
        expect(error).toBeDefined();
        expect(error?.invalidElements?.[0].inputs).toContain('url');
    });

    it('should group independent nodes into the same phase (Parallel Execution Verification)', () => {
        // Top-Level: Launch Browser (1)
        // Branch A: Launch -> A (2)
        // Branch B: Launch -> B (3)
        // Both A and B depend on 1, but are independent of each other.
        // Logic Plan:
        // Phase 1: Launch
        // Phase 2: A and B

        const nodes: AppNode[] = [
            {
                id: '1',
                position: { x: 0, y: 0 },
                data: { type: 'LAUNCH_BROWSER' as TaskType, inputs: { url: 'foo' } }
            },
            {
                id: '2',
                position: { x: 100, y: 100 },
                data: { type: 'PARALLEL_TASK' as TaskType, inputs: {} }
            },
            {
                id: '3',
                position: { x: 100, y: 200 },
                data: { type: 'PARALLEL_TASK' as TaskType, inputs: {} }
            }
        ];

        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2', targetHandle: 'trigger' },
            { id: 'e1-3', source: '1', target: '3', targetHandle: 'trigger' }
        ];

        const { executionPlan, error } = flowToExecutionPlan(nodes, edges);

        expect(error).toBeUndefined();
        expect(executionPlan).toHaveLength(2);

        const phase2Nodes = executionPlan![1].nodes;
        expect(phase2Nodes).toHaveLength(2);
        expect(phase2Nodes.map(n => n.id).sort()).toEqual(['2', '3']);
    });
});
