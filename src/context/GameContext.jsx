import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { generateCrashPoint } from '../utils/crashPoint.js';

const GameContext = createContext(null);

const DEFAULT_ROUND_WAIT_SECONDS = 6; // default countdown between rounds

// Default tunable growth parameters
const DEFAULT_GROWTH_RATE = 0.20;
const DEFAULT_GROWTH_EXPONENT = 0.90;

export function GameProvider({ children }) {
  const [phase, setPhase] = useState('WAITING'); // WAITING | RUNNING | CRASHED
  const [roundWaitSeconds, setRoundWaitSeconds] = useState(DEFAULT_ROUND_WAIT_SECONDS);
  const [countdown, setCountdown] = useState(DEFAULT_ROUND_WAIT_SECONDS);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(generateCrashPoint());
  const [history, setHistory] = useState([]); // last multipliers
  const [balance, setBalance] = useState(3000);

  const [userBets, setUserBets] = useState([]); // bets for the current round
  const [otherBets, setOtherBets] = useState([]);

  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  // Runtime tunable growth parameters (exposed to UI)
  const [growthRate, setGrowthRate] = useState(DEFAULT_GROWTH_RATE);
  const [growthExponent, setGrowthExponent] = useState(DEFAULT_GROWTH_EXPONENT);

  // Sound setting (persisted)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem('soundEnabled');
      return raw === null ? true : JSON.parse(raw);
    } catch (e) { return true; }
  });

  const toggleSound = (val) => {
    setSoundEnabled(s => {
      const next = typeof val === 'boolean' ? val : !s;
      try { localStorage.setItem('soundEnabled', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  // Controls to adjust speed/rate during runtime
  const increaseGrowthRate = (delta = 0.05) => setGrowthRate(r => +(r + delta).toFixed(4));
  const decreaseGrowthRate = (delta = 0.05) => setGrowthRate(r => Math.max(0.01, +(r - delta).toFixed(4)));
  const increaseGrowthExponent = (delta = 0.05) => setGrowthExponent(e => +(e + delta).toFixed(3));
  const decreaseGrowthExponent = (delta = 0.05) => setGrowthExponent(e => Math.max(0.2, +(e - delta).toFixed(3)));
  const increaseRoundSpeed = (deltaSec = -1) => setRoundWaitSeconds(s => Math.max(1, s + deltaSec)); // negative delta reduces wait

  const placeUserBet = useCallback((panelId, amount, options={}) => {
    if (phase !== 'WAITING') return false;
    if (amount <= 0 || amount > balance) return false;
    setBalance(b => b - amount);
    setUserBets(prev => {
      const existingForPanel = prev.find(b => b.panelId === panelId && b.roundId === crashPoint.roundId);
      if (existingForPanel) return prev; // already placed
      return [...prev, {
        id: `${panelId}-${Date.now()}`,
        panelId,
        amount,
        status: 'PENDING', // becomes ACTIVE when round starts
        autoBet: options.autoBet || false,
        autoCashout: options.autoCashout || null,
        cashoutMultiplier: null,
        winnings: null,
        roundId: crashPoint.roundId
      }];
    });
    return true;
  }, [phase, balance, crashPoint.roundId]);

  const toggleAutoBet = (panelId, enabled) => {
    setUserBets(prev => prev.map(b => b.panelId === panelId ? { ...b, autoBet: enabled } : b));
  };

  const updateBetAmount = (panelId, amount) => {
    setUserBets(prev => prev.map(b => b.panelId === panelId ? { ...b, amount } : b));
  };

  const cashOut = (panelId) => {
    setUserBets(prev => prev.map(b => {
      if (b.panelId === panelId && b.status === 'ACTIVE') {
        const winnings = +(b.amount * multiplier).toFixed(2);
        setBalance(x => x + winnings);
        return { ...b, status: 'CASHED', cashoutMultiplier: multiplier, winnings };
      }
      return b;
    }));
  };

  // Simulate other players each round
  const generateOtherBets = (roundId) => {
    const usernames = Array.from({ length: 30 }, (_, i) => `d***${(i+2)}`);
    const bets = usernames.map((u, i) => ({
      id: `other-${roundId}-${i}`,
      user: u,
      amount: [5,10,20,50,100][Math.floor(Math.random()*5)],
      status: 'PENDING',
      autoCashout: +( (Math.random()*3)+1.1 ).toFixed(2), // 1.1x - 4.1x
      cashoutMultiplier: null,
      winnings: null,
      roundId
    }));
    setOtherBets(bets);
  };

  // Round transition logic
  useEffect(() => {
    if (phase === 'WAITING') {
      setMultiplier(1.00);
      const id = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(id);
            setPhase('RUNNING');
            startTimeRef.current = performance.now();
            return roundWaitSeconds; // reset for next cycle
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [phase]);

  // Game loop for RUNNING phase
  useEffect(() => {
    if (phase !== 'RUNNING') return;
    // Activate pending bets
    setUserBets(prev => prev.map(b => b.status === 'PENDING' ? { ...b, status: 'ACTIVE' } : b));
    setOtherBets(prev => prev.map(b => b.status === 'PENDING' ? { ...b, status: 'ACTIVE' } : b));

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000; // seconds
      // Growth model: exponential-ish for excitement
      // Growth uses runtime-tunable parameters
      const current = +(Math.min(crashPoint.value, (1 + Math.pow(elapsed * growthRate, growthExponent))).toFixed(2));
      setMultiplier(current);

      // Auto cashouts for others & user
      setOtherBets(prev => prev.map(b => {
        if (b.status === 'ACTIVE' && current >= b.autoCashout && current < crashPoint.value) {
          return { ...b, status: 'CASHED', cashoutMultiplier: b.autoCashout, winnings: +(b.amount * b.autoCashout).toFixed(2) };
        }
        return b;
      }));
      setUserBets(prev => prev.map(b => {
        if (b.status === 'ACTIVE' && b.autoCashout && current >= b.autoCashout && current < crashPoint.value) {
          const winnings = +(b.amount * b.autoCashout).toFixed(2);
            setBalance(x => x + winnings);
            return { ...b, status: 'CASHED', cashoutMultiplier: b.autoCashout, winnings };
        }
        return b;
      }));

      if (current >= crashPoint.value) {
        // Crash
        setPhase('CRASHED');
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, crashPoint, multiplier]);

  // Handle CRASHED phase -> settle remaining bets then go to WAITING
  useEffect(() => {
    if (phase !== 'CRASHED') return;
    // Settle losses
    setUserBets(prev => prev.map(b => {
      if (b.status === 'ACTIVE') return { ...b, status: 'LOST' };
      return b;
    }));
    setOtherBets(prev => prev.map(b => b.status === 'ACTIVE' ? { ...b, status: 'LOST' } : b));

    // Update history
    setHistory(h => [crashPoint.value.toFixed(2) + 'x', ...h].slice(0, 16));

  const timer = setTimeout(() => {
      // Prepare next round
      const nextCrash = generateCrashPoint();
      setCrashPoint(nextCrash);
      setPhase('WAITING');
      generateOtherBets(nextCrash.roundId);
      // Auto-bet re-placement
      setUserBets(prev => prev.filter(b => b.autoBet).map(b => ({
        ...b,
        id: `${b.panelId}-${Date.now()}`,
        status: 'PENDING',
        cashoutMultiplier: null,
        winnings: null,
        roundId: nextCrash.roundId
      })));
  }, 5000); // slightly longer pause after crash to slow bet cadence (was 3500)
    return () => clearTimeout(timer);
  }, [phase, crashPoint]);

  // Initialize first round others
  useEffect(() => {
    generateOtherBets(crashPoint.roundId);
  }, []); // eslint-disable-line

  return (
    <GameContext.Provider value={{
  phase, countdown, multiplier, crashPoint, history,
  balance, userBets, otherBets,
  placeUserBet, cashOut, toggleAutoBet, updateBetAmount,
  // runtime tunables
  growthRate, growthExponent, roundWaitSeconds,
  increaseGrowthRate, decreaseGrowthRate,
  increaseGrowthExponent, decreaseGrowthExponent,
  increaseRoundSpeed
  , soundEnabled, toggleSound
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
