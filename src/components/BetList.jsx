import React from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function BetList() {
  const { userBets, otherBets, phase, multiplier } = useGame();
  const all = [...userBets.map(b => ({ ...b, user: 'You' })), ...otherBets];
  return (
    <div className="flex-1 flex flex-col glass p-2 rounded-r">
      <div className="px-3 py-2 border-b border-gray-800 text-xs uppercase tracking-wider flex justify-between">
        <span>All Bets</span>
        <span className="text-gray-500 text-[10px]">{all.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin text-sm">
        {all.map(b => (
          <div key={b.id} className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-900 hover:backdrop-blur-sm hover:bg-white/2">
            <div className="flex-1 truncate">{b.user}</div>
            <div className="w-16 text-right">{b.amount.toFixed ? b.amount.toFixed(2) : b.amount}.00</div>
            <div className="w-16 text-right text-xs">
              {b.status === 'ACTIVE' && phase === 'RUNNING' && <span className="text-warning">{multiplier.toFixed(2)}x</span>}
              {b.status === 'CASHED' && <span className="text-success">{b.cashoutMultiplier.toFixed(2)}x</span>}
              {b.status === 'LOST' && <span className="text-accent">--</span>}
              {b.status === 'PENDING' && <span className="text-gray-500">Pending</span>}
            </div>
            <div className="w-20 text-right text-xs">
              {b.status === 'CASHED' && <span className="text-success">{b.winnings.toFixed(2)}</span>}
              {b.status === 'LOST' && <span className="text-accent">0.00</span>}
            </div>
          </div>
        ))}
        {all.length === 0 && <div className="p-4 text-center text-gray-500">No bets</div>}
      </div>
      <div className="p-2 text-[10px] text-gray-500">This game is <span className="text-green-500">Provably Fair</span></div>
    </div>
  );
}
