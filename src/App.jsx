import React, { useState } from 'react';
import TopBar from './components/TopBar.jsx';
import GameScreen from './components/GameScreen.jsx';
import BetPanel from './components/BetPanel.jsx';
import BetList from './components/BetList.jsx';
import MultiplierHistory from './components/MultiplierHistory.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useGame } from './context/GameContext.jsx';

export default function App() {
  const { balance } = useGame();
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'game'

  const handlePlay = () => setView('game');
  const handleBack = () => setView('dashboard');

  return (
    <div className="flex flex-col h-full select-none">
      <TopBar balance={balance} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-800 hidden md:flex flex-col">
          <BetList />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2">
            <MultiplierHistory />
          </div>
          <div className="flex-1 flex flex-col px-4 pb-2">
            {view === 'dashboard' ? (
              <Dashboard onPlay={handlePlay} />
            ) : (
              <>
                <GameScreen onBack={handleBack} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <BetPanel panelId="A" />
                  <BetPanel panelId="B" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
