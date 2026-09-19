import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sparkles, Bot, User, Code, Image as ImageIcon, Plus, Trash2, Send } from 'lucide-react';
import api from '../../utils/axios';

// Custom Node for User Prompts
function PromptNode({ data }) {
  return (
    <div className="w-72 rounded-2xl border border-indigo-500/40 bg-[#161822] p-4 shadow-xl text-white">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-400">
        <User size={14} />
        <span>Prompt</span>
      </div>
      <p className="text-sm font-medium text-slate-100">{data.label}</p>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-indigo-500" />
    </div>
  );
}

// Custom Node for AI Responses
function ResponseNode({ data }) {
  return (
    <div className="w-80 rounded-2xl border border-white/10 bg-[#11131a] p-4 shadow-2xl text-white max-h-96 overflow-y-auto">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-violet-500" />
      <div className="flex items-center justify-between gap-2 mb-2 text-xs font-semibold text-violet-400 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Bot size={14} />
          <span>CortexAI</span>
        </div>
        {data.agent && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] uppercase tracking-wider text-slate-400">
            {data.agent}
          </span>
        )}
      </div>
      <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
        {data.content}
      </div>
      {data.image && (
        <img src={data.image} alt="AI Generated" className="mt-3 w-full h-36 object-cover rounded-xl border border-white/10" />
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-violet-500" />
    </div>
  );
}

const nodeTypes = {
  promptNode: PromptNode,
  responseNode: ResponseNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'promptNode',
    data: { label: 'Design a high-converting AI SaaS Landing Page' },
    position: { x: 250, y: 50 },
  },
  {
    id: '2',
    type: 'responseNode',
    data: {
      content: '# 🚀 Landing Page Blueprint\n\n1. **Hero**: Animated gradient with dynamic demo\n2. **Features**: 3-tier value props with interactive sandbox\n3. **Social Proof**: Real-time testimonials\n4. **CTA**: Frictionless Google Sign-in',
      agent: 'Team Swarm'
    },
    position: { x: 230, y: 220 },
  },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1' } }];

export default function CanvasBoard({ conversationId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [newPrompt, setNewPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#818cf8' } }, eds)),
    [setEdges]
  );

  const handleAddPromptNode = async () => {
    if (!newPrompt.trim()) return;

    const promptId = `prompt-${Date.now()}`;
    const responseId = `response-${Date.now() + 1}`;

    const promptPosition = {
      x: Math.random() * 300 + 150,
      y: Math.random() * 200 + 100,
    };

    const newPromptNode = {
      id: promptId,
      type: 'promptNode',
      data: { label: newPrompt },
      position: promptPosition,
    };

    setNodes((nds) => [...nds, newPromptNode]);
    const currentPromptText = newPrompt;
    setNewPrompt('');
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('prompt', currentPromptText);
      formData.append('agent', 'auto');
      if (conversationId) formData.append('conversationId', conversationId);

      const res = await api.post('/api/agent/chat', formData);
      const answer = res.data?.answer || 'Response generated.';
      const images = res.data?.images || [];

      const newResponseNode = {
        id: responseId,
        type: 'responseNode',
        data: {
          content: answer,
          agent: 'CortexAI',
          image: images[0] || null,
        },
        position: { x: promptPosition.x, y: promptPosition.y + 180 },
      };

      setNodes((nds) => [...nds, newResponseNode]);
      setEdges((eds) => [
        ...eds,
        { id: `e-${promptId}-${responseId}`, source: promptId, target: responseId, animated: true, style: { stroke: '#6366f1' } }
      ]);
    } catch (err) {
      console.error('Canvas generate error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="relative w-full h-full bg-[#090a0f] overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#13151c]/90 backdrop-blur-md border border-white/10 p-2 rounded-2xl shadow-xl">
        <input
          type="text"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddPromptNode()}
          placeholder="Type an idea or prompt for the canvas..."
          className="w-72 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
        />
        <button
          onClick={handleAddPromptNode}
          disabled={isGenerating || !newPrompt.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium shadow-md transition cursor-pointer"
        >
          {isGenerating ? <Sparkles size={13} className="animate-spin" /> : <Plus size={13} />}
          <span>{isGenerating ? 'Thinking...' : 'Add Node'}</span>
        </button>
        <button
          onClick={handleClearCanvas}
          title="Clear Canvas"
          className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
        <Controls className="!bg-[#13151c] !border-white/10 !fill-white !rounded-xl overflow-hidden shadow-2xl" />
        <MiniMap
          nodeColor="#6366f1"
          className="!bg-[#13151c] !border-white/10 !rounded-xl overflow-hidden shadow-2xl"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
    </div>
  );
}
