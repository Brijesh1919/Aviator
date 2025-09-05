import React from 'react';

export default function MinesControls({
  minesCount,
  setMinesCount,
  betInput,
  setBetInput,
  onPrimary,
  primaryLabel = 'BET',
  onNewGame,
  autoPick,
  setAutoPick,
  onPickCount,
  balance,
  gameActive
}) {
  return (
    <div className="mt-6 w-full max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="bg-panel p-3 rounded flex items-center gap-3">
          <div className="text-xs text-gray-400">MINES</div>
          <select
            disabled={gameActive}
            value={minesCount}
            onChange={e=>setMinesCount(parseInt(e.target.value))}
            className="bg-white text-black px-2 rounded"
          >
            {Array.from({length:24},(_,i)=>i+1).map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="flex-1 bg-panel p-3 rounded flex items-center gap-3">
          <div className="text-xs text-gray-400">BET AMOUNT</div>
          <input disabled={gameActive} className="bg-transparent text-white w-full text-lg" value={betInput} onChange={e=>setBetInput(e.target.value)} />
        </div>

        <div className="bg-panel p-3 rounded text-sm">
          <div className="text-xs text-gray-400">BALANCE</div>
          <div className="font-semibold text-green-300">USD {Number(balance).toFixed(2)}</div>
        </div>

        <button onClick={onNewGame} className="px-4 py-3 bg-panel-alt rounded text-sm">New Game</button>
        <button onClick={onPrimary} className={`px-6 py-3 ${gameActive ? 'bg-yellow-500 text-black' : 'bg-pink-500 text-white'} rounded-lg font-semibold`}>{primaryLabel}</button>

        <label className="ml-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={autoPick} onChange={e=>setAutoPick(e.target.checked)} /> Autopick</label>
      </div>

      <div className="mt-3 flex gap-2">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={()=>onPickCount(n)} className="px-3 py-2 bg-panel-alt rounded text-sm">{n}</button>
        ))}
      </div>
    </div>
  )
}
