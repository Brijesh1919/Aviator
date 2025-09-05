import React from 'react';
import { Menu } from 'lucide-react';
import { useGame } from '../context/GameContext.jsx';

// Fallback tiny icon if lucide-react not installed (avoid extra dep). We'll define a dummy.
function FallbackMenuIcon(props){ return <div {...props}>≡</div>; }
const Icon = Menu || FallbackMenuIcon;

export default function TopBar({ balance }) {
  const { soundEnabled, toggleSound } = useGame();
  return (
    <div className="flex items-center justify-between px-3 md:px-4 h-14 glass-strong border-b border-gray-800">
      <div className="flex items-center gap-3">
        <div className="text-accent font-bold text-lg md:text-xl tracking-wide">Aviator</div>
        <button className="text-xs bg-gray-700/40 px-2 py-1 rounded hover:bg-gray-600/50 hidden sm:inline">How to play?</button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-success font-semibold text-sm md:text-lg">{balance.toFixed(2)} <span className="text-gray-400 text-xs md:text-sm">USD</span></div>
        {/* Sound toggle wired to context */}
        <button onClick={() => toggleSound()} title={soundEnabled? 'Mute' : 'Unmute'} className="p-2 rounded hover:bg-panel-alt text-xs">
          {soundEnabled ? '🔊' : '🔈'}
        </button>
        <button className="p-2 rounded hover:bg-panel-alt">
          <Icon size={18} />
        </button>
      </div>
    </div>
  );
}
