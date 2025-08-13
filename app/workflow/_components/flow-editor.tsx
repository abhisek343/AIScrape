'use client';

import { useCallback, useEffect } from 'react';
import { Workflow } from '@prisma/client';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  getOutgoers,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';

import NodeComponent from '@/app/workflow/_components/nodes/node-component';
import DeletableEdge from '@/app/workflow/_components/edges/deletable-edge';

import { createFlowNode } from '@/lib/workflow/create-flow-node';
import { TaskType } from '@/types/task';
import { AppNode } from '@/types/appnode';

import '@xyflow/react/dist/style.css';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(() => import('@/components/chatbot/chatbot-widget').then(m => m.ChatbotWidget), { ssr: false });

const nodeTypes = {
  AIScrapeNode: NodeComponent,
};

const edgeTypes = {
  default: DeletableEdge,
};

const snapGrid: [number, number] = [50, 50];
const fitViewOptions = { padding: 1 };

export default function FlowEditor({ workflow }: { workflow: Workflow }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setViewport, screenToFlowPosition, updateNodeData, fitView } = useReactFlow();

  useEffect(() => {
    try {
      const flow = JSON.parse(workflow.definition);
      if (!flow) return;

      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);

      if (flow.viewport) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setViewport({ x, y, zoom });
      } else {
        // No saved viewport; auto fit view when nodes exist
        setTimeout(() => fitView({ padding: 0.2 }), 100);
      }
  } catch (error) {
    console.error("Failed to parse workflow definition in FlowEditor:", error);
  }
}, [workflow.definition, setEdges, setNodes, setViewport, fitView]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const taskType = e.dataTransfer.getData('application/reactflow');
      if (typeof taskType === undefined || !taskType) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const newNode = createFlowNode(taskType as TaskType, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
      if (!connection.targetHandle) return;

      // Remove input value if it is present on connection
      const node = nodes.find((nd) => nd.id === connection.target);
      if (!node) return;

      const nodeInputs = node.data.inputs;
      updateNodeData(node.id, {
        inputs: {
          ...nodeInputs,
          [connection.targetHandle]: '',
        },
      });
    },
    [setEdges, updateNodeData, nodes]
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      // Self-connection not allowed
      if (connection.source === connection.target) {
        return false;
      }

      // Same taskParam type connection not allowed
      const source = nodes.find((node) => node.id === connection.source);
      const target = nodes.find((node) => node.id === connection.target);
      if (!source || !target) {
        console.error('Invalid connection: source or target node not found');
        return false;
      }

      const sourceTask = TaskRegistry[source.data.type];
      const targetTask = TaskRegistry[target.data.type];

      const output = sourceTask.outputs.find((o) => o.name === connection.sourceHandle);
      const input = targetTask.inputs.find((i) => i.name === connection.targetHandle);

      if (input?.type !== output?.type) {
        console.error('Invalid connection: Type mismatch');
        return false;
      }

      // Cycle connection not allowed
      const hasCycle = (node: AppNode, visited = new Set()) => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      const detectedCycle = hasCycle(target);

      return !detectedCycle;
    },
    [nodes, edges]
  );

  // Ensure we fit to nodes whenever they change (robust against missing viewport)
  useEffect(() => {
    if (nodes.length > 0) {
      const id = setTimeout(() => fitView({ padding: 0.2 }), 200);
      return () => clearTimeout(id);
    }
  }, [nodes.length, edges.length, fitView]);

  return (
    <main className="h-full w-full min-h-[60svh]" style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={snapGrid}
        fitView
        fitViewOptions={fitViewOptions}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
      >
        <Controls position="top-left" fitViewOptions={fitViewOptions} />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      <ChatbotWidget workflowId={workflow.id} />
    </main>
  );
}
