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
  getIncomers,
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

// Move outside component to prevent recreation on every render
const nodeTypes = {
  AIScrapeNode: NodeComponent,
};

const edgeTypes = {
  default: DeletableEdge,
};

const snapGrid: [number, number] = [25, 25];
const fitViewOptions = { padding: 0.1, maxZoom: 1.2 };

const defaultEdgeOptions = {
  style: { stroke: '#10b981', strokeWidth: 3 },
  type: 'smoothstep',
};

export default function FlowEditor({ workflow, registerAutoLayout }: { workflow: Workflow; registerAutoLayout?: (fn: () => void) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setViewport, screenToFlowPosition, updateNodeData, fitView } = useReactFlow();

  // Register auto layout function with parent
  useEffect(() => {
    if (!registerAutoLayout) return;
    const fn = () => {
      const layerGapX = 280;
      const layerGapY = 160;
      const ns = nodes;
      const es = edges;
      const indegree = new Map(ns.map(n => [n.id, 0]));
      es.forEach(e => indegree.set(e.target, (indegree.get(e.target) || 0) + 1));
      const roots = ns.filter(n => (indegree.get(n.id) || 0) === 0).map(n => n.id);
      const layer = new Map<string, number>();
      const q: string[] = [...roots];
      roots.forEach(id => layer.set(id, 0));
      while (q.length) {
        const id = q.shift()!;
        const l = layer.get(id)!;
        es.filter(e => e.source === id).forEach(e => {
          const nl = Math.max(l + 1, layer.get(e.target) ?? 0);
          if (!layer.has(e.target) || nl > (layer.get(e.target) ?? 0)) {
            layer.set(e.target, nl);
            q.push(e.target);
          }
        });
      }
      const levels: Record<number, string[]> = {};
      ns.forEach(n => {
        const lv = layer.get(n.id) ?? 0;
        levels[lv] = levels[lv] || [];
        levels[lv].push(n.id);
      });
      let y = 0;
      Object.keys(levels).sort((a,b)=>Number(a)-Number(b)).forEach(lv => {
        const ids = levels[Number(lv)];
        const startX = -(ids.length - 1) * (layerGapX / 2);
        ids.forEach((id, idx) => {
          setNodes(nds => nds.map(nn => nn.id === id ? { ...nn, position: { x: startX + idx * layerGapX, y } } : nn));
        });
        y += layerGapY;
      });
      fitView({ padding: 0.2, maxZoom: 1 });
    };
    registerAutoLayout(fn);
  }, [registerAutoLayout, nodes, edges, setNodes, fitView]);

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
        setTimeout(() => fitView({ padding: 0.1, maxZoom: 1 }), 100);
      }
  } catch (error) {
    console.error("Failed to parse workflow definition in FlowEditor:", error);
  }
}, [workflow.definition, setEdges, setNodes, setViewport, fitView]);

  const onNodeDrag = useCallback((event: React.MouseEvent, nodeId: string) => {
    // When dragging a node that has edges, auto-reposition connected edges' labels and encourage smoother drag
    // (React Flow handles edge paths automatically; this is just to force updates).
    setEdges((eds) => eds.map((e) => ({ ...e })));
  }, [setEdges]);

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

      // On connect, attempt minimal auto-layout: nudge target below source if overlapping
      const source = nodes.find((n) => n.id === connection.source);
      const target = nodes.find((n) => n.id === connection.target);
      if (source && target) {
        setNodes((nds) => nds.map((n) => {
          if (n.id === target.id) {
            const dx = 0;
            const dy = (target.position.y <= source.position.y + 80) ? (source.position.y + 120 - target.position.y) : 0;
            return dy ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } } : n;
          }
          return n;
        }));
      }
    },
    [setEdges, updateNodeData, nodes, setNodes]
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
      const id = setTimeout(() => fitView({ padding: 0.1, maxZoom: 1 }), 200);
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
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid
        snapGrid={snapGrid}
        fitView
        fitViewOptions={fitViewOptions}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
       onNodeDrag={onNodeDrag}
    >
        <Controls position="top-left" fitViewOptions={fitViewOptions} showZoom={true} showFitView={true} showInteractive={true} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} />
      </ReactFlow>
      <ChatbotWidget workflowId={workflow.id} />
    </main>
  );
}
