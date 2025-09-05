import React from 'react';
import planeSvg from '../assets/plane.svg';

export default function AviatorCard({ onPlay }) {
  return (
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
  );
}
