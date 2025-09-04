import React from 'react';
import { Menu } from 'lucide-react';

// Fallback tiny icon if lucide-react not installed (avoid extra dep). We'll define a dummy.
function FallbackMenuIcon(props){ return <div {...props}>≡</div>; }
const Icon = Menu || FallbackMenuIcon;

export default function TopBar({ balance }) {
  return (
    <div className="flex items-center justify-between px-4 h-14 bg-panel shadow-inner border-b border-gray-800">
      <div className="flex items-center gap-3">
        <div className="text-accent font-bold text-xl tracking-wide">Aviator</div>
        <button className="text-xs bg-gray-700/40 px-2 py-1 rounded hover:bg-gray-600/50">How to play?</button>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-success font-semibold text-lg">{balance.toFixed(2)} <span className="text-gray-400 text-sm">USD</span></div>
        <button className="p-2 rounded hover:bg-panel-alt">
          <Icon size={18} />
        </button>
      </div>
    </div>
  );
}
