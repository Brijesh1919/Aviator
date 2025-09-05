import React from 'react';
export default function MinesCard({ onPlay }) {
  return (
    <div className="glass-strong rounded-lg p-4 transform hover:scale-[1.02] transition shadow-lg hover:shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="w-20 h-12 bg-yellow-200 rounded flex items-center justify-center text-2xl">💎</div>
        <div>
          <div className="text-lg font-semibold">Mines</div>
          <div className="text-xs text-gray-400">Pick tiles, avoid mines, collect diamonds</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-400">5x5 board with adjustable mines</div>
        <button onClick={onPlay} className="px-4 py-2 bg-accent text-white rounded-md font-semibold hover:bg-accent-soft">Play</button>
      </div>
    </div>
  );
}
