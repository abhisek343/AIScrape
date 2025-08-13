'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Globe, List, Webhook } from 'lucide-react';

type NodeDef = {
  id: string;
  x: number;
  y: number;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export default function WorkflowAnimation() {
  // Coordinate system is 1000 x 600 for easy math; SVG scales responsively
  const nodes: NodeDef[] = useMemo(
    () => [
      { id: 'A', x: 120, y: 320, title: 'Launch Browser', Icon: Rocket },
      { id: 'B', x: 380, y: 200, title: 'Navigate URL', Icon: Globe },
      { id: 'C', x: 640, y: 380, title: 'Extract List', Icon: List },
      { id: 'D', x: 880, y: 220, title: 'Webhook', Icon: Webhook },
    ],
    []
  );

  const pathPoints = useMemo(() => nodes.map((n) => `${n.x},${n.y}`).join(' '), [nodes]);
  const tokenKeyframes = useMemo(() => nodes.map((n) => ({ x: n.x, y: n.y })), [nodes]);

  return (
    <div className="w-full">
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-tr from-emerald-400/30 via-emerald-500/20 to-emerald-400/30 shadow-xl shadow-emerald-900/10">
        <div className="relative w-full h-[380px] md:h-[440px] rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur">
          {/* ambient glows */}
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-2xl" />

          <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full" aria-label="Animated workflow diagram">
            {/* Background grid (subtle) */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-emerald-900/5 dark:text-emerald-100/5" strokeWidth="1" />
              </pattern>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity="0.0" />
                <stop offset="50%" stopColor="hsl(160 84% 39%)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect x="0" y="0" width="1000" height="600" fill="url(#grid)" />

            {/* Base edges */}
            <polyline
              points={pathPoints}
              fill="none"
              stroke="currentColor"
              className="text-emerald-500/25"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Moving highlight along edges (by dashing) */}
            <motion.polyline
              points={pathPoints}
              fill="none"
              stroke="url(#edgeGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="120 600"
              animate={{ strokeDashoffset: [720, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'linear' }}
              filter="url(#glow)"
            />
            {/* secondary soft highlight */}
            <motion.polyline
              points={pathPoints}
              fill="none"
              stroke="url(#edgeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="140 700"
              animate={{ strokeDashoffset: [840, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
              opacity={0.2}
              filter="url(#glow)"
            />

            {/* Data token comet (soft tail) */}
            <motion.circle
              r="22"
              fill="hsl(160 84% 39% / 0.10)"
              filter="url(#glow)"
              animate={{ x: tokenKeyframes.map((k) => k.x), y: tokenKeyframes.map((k) => k.y) }}
              transition={{ duration: 6.2, repeat: Infinity, times: [0, 0.33, 0.66, 1], ease: 'easeInOut' }}
            />
            {/* Primary token */}
            <motion.circle
              r="11"
              fill="hsl(160 84% 39%)"
              filter="url(#glow)"
              animate={{ x: tokenKeyframes.map((k) => k.x), y: tokenKeyframes.map((k) => k.y) }}
              transition={{ duration: 6.2, repeat: Infinity, times: [0, 0.33, 0.66, 1], ease: 'easeInOut' }}
            />
            {/* Secondary token for liveliness */}
            <motion.circle
              r="8"
              fill="hsl(160 84% 39% / 0.8)"
              filter="url(#glow)"
              animate={{ x: tokenKeyframes.map((k) => k.x), y: tokenKeyframes.map((k) => k.y) }}
              transition={{ duration: 6.2, delay: 1.6, repeat: Infinity, times: [0, 0.33, 0.66, 1], ease: 'easeInOut' }}
              opacity={0.85}
            />

            {/* Nodes */}
            {nodes.map((n, i) => (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                {/* Pulse when token arrives */}
                <motion.circle
                  r="26"
                  fill="none"
                  stroke="hsl(160 84% 39%)"
                  strokeOpacity="0.25"
                  strokeWidth="2"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.8, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <rect x={-90} y={-40} rx={12} ry={12} width={180} height={80} className="fill-white/95 dark:fill-slate-950/70 stroke-emerald-200/60 dark:stroke-emerald-800/60" strokeWidth="1.5" filter="url(#glow)" />
                <foreignObject x={-80} y={-28} width={160} height={56}>
                  <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <n.Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold">{n.title}</span>
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}


