import React from 'react';
import AviatorCard from './AviatorCard.jsx';
import MinesCard from './Mines/MinesCard.jsx';

export default function Dashboard({ onPlay }) {
  return (
    <div className="flex-1 p-8 overflow-auto bg-gradient-to-b from-panel to-panel-alt">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AviatorCard onPlay={() => onPlay('aviator')} />
          <MinesCard onPlay={() => onPlay('mines')} />
        </div>
      </div>
    </div>
  );
}
