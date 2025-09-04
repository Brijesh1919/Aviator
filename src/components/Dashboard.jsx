import React from 'react';
import planeSvg from '../assets/plane.svg';

export default function Dashboard({ onPlay }) {
  return (
    <div className="flex-1 p-8 overflow-auto bg-gradient-to-b from-panel to-panel-alt">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-strong rounded-lg p-4 transform hover:scale-[1.02] transition shadow-lg hover:shadow-2xl">
            <div className="flex items-center gap-4">
              <img src={planeSvg} alt="aviator" className="w-20 h-12 object-contain" style={{filter: 'invert(17%) sepia(97%) saturate(600%) hue-rotate(-10deg) brightness(95%)'}} />
              <div>
                <div className="text-lg font-semibold">Aviator Crash Game</div>
                <div className="text-xs text-gray-400">Classic multiplier crash game</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">Play solo or test bets</div>
              <button onClick={onPlay} className="px-4 py-2 bg-accent text-white rounded-md font-semibold hover:bg-accent-soft">Play</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
