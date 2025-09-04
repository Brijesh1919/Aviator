import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';
import clsx from 'clsx';

export default function BetPanel({ panelId }) {
  const { phase, multiplier, userBets, placeUserBet, cashOut, toggleAutoBet, updateBetAmount } = useGame();
  const betForPanel = userBets.find(b => b.panelId === panelId && b.roundId);
  const [amount, setAmount] = useState(1);
  const [autoBet, setAutoBet] = useState(false);
  const [autoCashout, setAutoCashout] = useState('');

  useEffect(() => {
    if (!betForPanel) return;
    if (betForPanel.autoBet !== autoBet) toggleAutoBet(panelId, autoBet);
    if (betForPanel.amount !== amount) updateBetAmount(panelId, amount);
  }, [amount, autoBet]); // eslint-disable-line

  const increments = [1,2,5,10];

  const status = betForPanel?.status;

  const canPlace = phase === 'WAITING' && (!status || status === 'CASHED' || status === 'LOST');
  const canCashout = status === 'ACTIVE' && phase === 'RUNNING';

  const handleBet = () => {
    placeUserBet(panelId, amount, { autoBet, autoCashout: autoCashout? parseFloat(autoCashout): null });
  };

  const handleCashout = () => cashOut(panelId);

  return (
  <div className="glass rounded-lg p-4 border border-gray-800 flex flex-col gap-4">
      <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
        <span>Bet {panelId}</span>
        {status && <span className={clsx('font-semibold', status === 'CASHED' && 'text-success', status === 'LOST' && 'text-accent')}>{status}</span>}
      </div>
      <div>
  <div className="flex items-center glass rounded px-3 py-2 gap-2 border border-gray-700">
          <input type="number" className="bg-transparent flex-1 outline-none" min={0.1} step={0.1} value={amount} onChange={e => setAmount(parseFloat(e.target.value)||0)} />
          <span className="text-xs text-gray-500">USD</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {increments.map(inc => <button key={inc} onClick={()=>setAmount(a=>+(a+inc).toFixed(2))} className="bg-panel-alt hover:bg-panel text-xs py-1 rounded">+{inc}</button>)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={autoBet} onChange={e=>setAutoBet(e.target.checked)} /> Auto Bet
        </label>
        <div className="flex items-center gap-2 text-xs">
          <span>Auto Cashout</span>
          <input type="number" className="w-20 bg-panel-alt rounded px-1 py-0.5 text-xs" min={1.01} step={0.01} value={autoCashout} onChange={e=>setAutoCashout(e.target.value)} placeholder="--" />
        </div>
      </div>
      <div>
  {canPlace && <button onClick={handleBet} className={clsx('w-full h-16 text-xl rounded-md font-bold bg-accent text-white hover:bg-accent-soft', !canPlace && 'btn-disabled')}>BET {amount.toFixed(2)}</button>}
  {canCashout && <button onClick={handleCashout} className="w-full h-16 text-xl rounded-md font-bold bg-success hover:opacity-90 text-white">CASHOUT { (amount * multiplier).toFixed(2) }</button>}
        {status === 'CASHED' && <div className="w-full h-16 flex items-center justify-center text-success font-semibold text-lg">Won { (betForPanel.winnings).toFixed(2) }</div>}
        {status === 'LOST' && <div className="w-full h-16 flex items-center justify-center text-accent font-semibold text-lg">Lost { amount.toFixed(2) }</div>}
        {phase==='RUNNING' && !status && <div className="w-full h-16 flex items-center justify-center text-gray-500">Bet Locked</div>}
      </div>
    </div>
  );
}
