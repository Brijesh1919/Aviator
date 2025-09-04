import React from 'react';
import { useGame } from '../context/GameContext.jsx';

export default function MultiplierHistory() {
  const { history } = useGame();
  return (
    <div className="flex gap-2 flex-wrap text-sm">
      {history.length === 0 && <span className="text-gray-500">No rounds yet</span>}
      {history.map((h, i) => (
        <span key={i} className={`px-2 py-1 rounded bg-panel-alt ${parseFloat(h) >= 2 ? 'text-accent' : 'text-gray-300'}`}>{h}</span>
      ))}
    </div>
  );
}
