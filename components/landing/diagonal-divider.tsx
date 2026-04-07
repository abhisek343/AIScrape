'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';

interface DiagonalDividerProps {
  flip?: boolean;
  className?: string;
}

export default function DiagonalDivider({ flip = false, className = '' }: DiagonalDividerProps) {
  const id = useId();
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height: '80px' }}>
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        style={{ transform: flip ? 'rotate(180deg)' : 'none' }}
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.1)" />
            <stop offset="50%" stopColor="rgba(52, 211, 153, 0.2)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.1)" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,80 L1200,0 L1200,80 L0,80 Z"
          fill={`url(#${id})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
      </svg>
    </div>
  );
}

export function WaveDivider({ flip = false, className = '' }: DiagonalDividerProps) {
  const id = useId();
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height: '100px' }}>
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        style={{ transform: flip ? 'rotate(180deg)' : 'none' }}
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.05)" />
            <stop offset="50%" stopColor="rgba(52, 211, 153, 0.1)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0,50 Q300,0 600,50 T1200,50 L1200,100 L0,100 Z"
          fill={`url(#${id})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
      </svg>
    </div>
  );
}
