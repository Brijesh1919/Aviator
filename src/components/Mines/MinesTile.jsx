import React from 'react';

export default function MinesTile({ revealed, content, disabled, onClick }) {
  const face = revealed ? (content === 'diamond' ? '💎' : '💣') : '?';
  const base = revealed ? 'bg-panel-alt text-white' : 'bg-blue-600 text-blue-50';
  return (
    <button
      onClick={onClick}
      disabled={disabled || revealed}
      className={`rounded-lg border border-gray-700 flex items-center justify-center ${base} shadow-lg select-none`}
      style={{ aspectRatio: '1 / 1', width: 64, height: 64 }}
    >
      <div className="text-2xl font-extrabold pointer-events-none">{face}</div>
    </button>
  );
}
