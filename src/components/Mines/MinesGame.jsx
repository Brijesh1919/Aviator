import React, { useState, useMemo, useEffect, useRef } from 'react';
import MinesTile from './MinesTile.jsx';
import MinesControls from './MinesControls.jsx';
import { getMultiplier } from '../../utils/minesMultipliers.js';

function makeBoard(size = 5, mines = 4) {
  const total = size * size;
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const mineSet = new Set(indices.slice(0, mines));
  const board = [];
  for (let i = 0; i < total; i++) board.push({ content: mineSet.has(i) ? 'mine' : 'diamond', revealed: false });
  return board;
}

export default function MinesGame({ onBack }) {
  const size = 5;
  const totalTiles = size * size;
  const [minesCount, setMinesCount] = useState(4);
  const [board, setBoard] = useState(() => makeBoard(size, minesCount));
  const [gameActive, setGameActive] = useState(false);
  const [lockedMines, setLockedMines] = useState(null); // number of mines locked when bet placed
  const [collected, setCollected] = useState(0);
  const [betInput, setBetInput] = useState('1');
  const [currentBet, setCurrentBet] = useState(0);
  const [autoPick, setAutoPick] = useState(false);
  const [lastWinnings, setLastWinnings] = useState(0);
  const [balance, setBalance] = useState(3000);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);

  useEffect(() => {
    // lazy create AudioContext on mount
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
      return () => {
        try { master.disconnect(); } catch(e) {}
        try { ctx.close(); } catch(e) {}
      };
    } catch (e) {
      // WebAudio not supported
      audioCtxRef.current = null;
    }
  }, []);

  function resumeAudioIfNeeded() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(()=>{});
    }
  }

  function playDiamondSound() {
    const ctx = audioCtxRef.current; if (!ctx) return;
    resumeAudioIfNeeded();
    const now = ctx.currentTime;
    // bell-ish tone
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o.connect(g);
    g.connect(masterGainRef.current);
    o.start(now);
    o.stop(now + 0.7);
  }

  function playMineBlast() {
    const ctx = audioCtxRef.current; if (!ctx) return;
    resumeAudioIfNeeded();
    const now = ctx.currentTime;
    // sub-bass thump
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(60, now);
    g1.gain.setValueAtTime(0.0001, now);
    g1.gain.linearRampToValueAtTime(0.8, now + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    o1.connect(g1);
    g1.connect(masterGainRef.current);
    o1.start(now);
    o1.stop(now + 1);

    // filtered noise for blast
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.Q.setValueAtTime(1, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.9, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    noise.connect(noiseFilter);
    noiseFilter.connect(g2);
    g2.connect(masterGainRef.current);
    noise.start(now);
    noise.stop(now + 1);
  }

  const safeCount = totalTiles - (lockedMines ?? minesCount);

  function newGame() {
  setBoard(makeBoard(size, minesCount));
    setCollected(0);
    setLastWinnings(0);
    setGameActive(false);
    setCurrentBet(0);
  setLockedMines(null);
  }

  function startBet() {
    // parse bet and start a round
    const amt = parseFloat(betInput) || 0;
    if (amt <= 0) return;
    if (amt > balance) return; // could show UI feedback
    setBalance(b => +(b - amt).toFixed(8));
    setCurrentBet(amt);
  // lock selected mines and generate board accordingly
  setLockedMines(minesCount);
  setBoard(makeBoard(size, minesCount));
    setCollected(0);
    setLastWinnings(0);
    setGameActive(true);
  }

  function endGameLost() {
    setGameActive(false);
    setCurrentBet(0);
    setLastWinnings(0);
  setLockedMines(null);
  }

  function cashout() {
    if (!gameActive || currentBet <= 0) return;
    const mult = currentMultiplierValue();
    // handle infinite multiplier edge-case
    let win;
    if (!isFinite(mult)) {
      // very large payout; cap to a big number to avoid Infinity propagation
      win = currentBet * (totalTiles * 1000);
    } else {
      win = currentBet * mult;
    }
    setBalance(b => +(b + win).toFixed(8));
    setLastWinnings(win);
    setGameActive(false);
    setCurrentBet(0);
    setLockedMines(null);
  }

  function revealAt(idx) {
    if (!gameActive) return;
    setBoard(prev => {
      if (prev[idx].revealed) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], revealed: true };
      if (next[idx].content === 'mine') {
        // play mine blast
        try { playMineBlast(); } catch(e) {}
        endGameLost();
      } else {
        try { playDiamondSound(); } catch(e) {}
        setCollected(c => c + 1);
      }
      return next;
    });
  }

  function autopickOne() {
    if (!gameActive) return;
    const safe = board.map((b, i) => (!b.revealed && b.content === 'diamond') ? i : -1).filter(i => i >= 0);
    if (safe.length === 0) return;
    revealAt(safe[Math.floor(Math.random() * safe.length)]);
  }

  function pickN(n) {
    if (!gameActive) return;
    for (let i = 0; i < n; i++) autopickOne();
  }

  function currentMultiplierValue() {
    const minesUsed = lockedMines ?? minesCount;
    const diamonds = collected;
    const fromTable = getMultiplier(totalTiles, minesUsed, diamonds);
    return fromTable;
  }

  const currentMultiplier = useMemo(() => {
    const v = currentMultiplierValue();
    return isFinite(v) ? v.toFixed(2) + 'x' : '∞';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collected, minesCount, lockedMines]);

  return (
    <div className="flex-1 p-6 bg-gradient-to-b from-panel to-panel-alt min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Mines</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-green-300 font-semibold">USD {balance.toFixed(2)}</div>
          <button onClick={onBack} className="px-3 py-1 bg-panel-alt rounded">Back</button>
        </div>
      </div>

      <div className="flex gap-6 items-stretch flex-1">
        <aside className="w-36 bg-panel p-4 rounded flex flex-col items-center justify-center hidden lg:flex">
          <div className="text-sm text-gray-400">DIAMONDS</div>
          <div className="text-4xl font-bold mt-3 text-green-300">{collected}</div>
        </aside>

        <main className="flex-1 flex flex-col items-center">
          <div className="grid grid-cols-5 gap-3 p-4 bg-transparent rounded">
            {board.map((cell, i) => (
              <MinesTile key={i} revealed={cell.revealed} content={cell.content} disabled={!gameActive} onClick={() => revealAt(i)} />
            ))}
          </div>

          <div className="mt-6 w-full max-w-4xl text-center">
            <div className="text-sm text-gray-400">Current multiplier</div>
            <div className="text-2xl font-bold mt-1">{currentMultiplier}</div>
          </div>

          <MinesControls
            minesCount={minesCount}
            setMinesCount={setMinesCount}
            betInput={betInput}
            setBetInput={setBetInput}
            onPrimary={() => {
              if (!gameActive) startBet(); else cashout();
            }}
            primaryLabel={!gameActive ? 'BET' : 'CASHOUT'}
            onNewGame={newGame}
            autoPick={autoPick}
            setAutoPick={setAutoPick}
            onPickCount={pickN}
            balance={balance}
            gameActive={gameActive}
          />

          {lastWinnings > 0 && (
            <div className="mt-4 text-green-300 font-semibold">You cashed out: {lastWinnings.toFixed(8)}</div>
          )}
        </main>

        <aside className="w-36 bg-panel p-4 rounded flex flex-col items-center justify-center hidden lg:flex">
          <div className="text-sm text-gray-400">MINES</div>
          <div className="text-4xl font-bold mt-3 text-yellow-300">{minesCount}</div>
        </aside>
      </div>
    </div>
  );
}
