"use client";

import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 100, y: 150 }, data: { label: 'ROTTERDAM PORT (ORIGIN)' }, style: { background: '#0B1117', color: '#fff', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace' } },
  { id: '2', position: { x: 600, y: 100 }, data: { label: 'SINGAPORE HUB (DEST)' }, style: { background: '#0B1117', color: '#fff', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace' } },
  { id: '3', position: { x: 100, y: 350 }, data: { label: 'HAMBURG PORT (ORIGIN)' }, style: { background: '#0B1117', color: '#fff', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace' } },
  { id: '4', position: { x: 600, y: 400 }, data: { label: 'NEW YORK CUSTOMS (DEST)' }, style: { background: '#0B1117', color: '#fff', border: '1px solid #1F2937', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace' } },
  { id: '5', position: { x: 350, y: 250 }, data: { label: 'GLOBAL COMPLIANCE CHECKPOINT' }, style: { background: '#111827', color: '#38BDF8', border: '1px dashed #38BDF8', borderRadius: '8px', padding: '12px', fontSize: '10px', fontFamily: 'monospace' } }
];

const initialEdges = [
  { 
    id: 'e1-5', source: '1', target: '5', animated: true, 
    style: { stroke: '#FBBF24', strokeWidth: 2 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#FBBF24' } 
  },
  { 
    id: 'e5-2', source: '5', target: '2', animated: true, label: 'SKU-9921-A (CUSTOMS HOLD)', 
    style: { stroke: '#FBBF24', strokeWidth: 2, strokeDasharray: '5 5' }, 
    labelStyle: { fill: '#FBBF24', fontWeight: 700, fontFamily: 'monospace', fontSize: 10 },
    labelBgStyle: { fill: '#030712', fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#FBBF24' } 
  },
  { 
    id: 'e3-5', source: '3', target: '5', animated: true, 
    style: { stroke: '#38BDF8', strokeWidth: 2 }, 
    markerEnd: { type: MarkerType.ArrowClosed, color: '#38BDF8' } 
  },
  { 
    id: 'e5-4', source: '5', target: '4', animated: true, label: 'SKU-4412-B (CLEARED)', 
    style: { stroke: '#38BDF8', strokeWidth: 2 }, 
    labelStyle: { fill: '#38BDF8', fontWeight: 700, fontFamily: 'monospace', fontSize: 10 },
    labelBgStyle: { fill: '#030712', fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#38BDF8' } 
  },
];

export default function NetworkGraph({ statusFilter }: { statusFilter: string }) {
  
  // FIX: useMemo caches the edges so React Flow stops complaining about new objects
  const filteredEdges = useMemo(() => {
    return initialEdges.filter(edge => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'CUSTOMS_HOLD' && (edge.id === 'e1-5' || edge.id === 'e5-2')) return true;
      if (statusFilter === 'CLEARED' && (edge.id === 'e3-5' || edge.id === 'e5-4')) return true;
      return false;
    });
  }, [statusFilter]);

  return (
    <div className="w-full h-full bg-[#030712]">
      <ReactFlow nodes={initialNodes} edges={filteredEdges} fitView className="dark" attributionPosition="bottom-left">
        <Background color="#1F2937" gap={16} />
        <Controls style={{ backgroundColor: '#111827', border: '1px solid #1F2937', fill: '#fff' }} />
      </ReactFlow>
    </div>
  );
}
