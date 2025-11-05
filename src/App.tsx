import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';
import Menu from './components/Menu';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { GameMode, GameState } from './types/game';
import './App.css';

const AppContent: React.FC = () => {
  const { gameConfig, startGame, resetGame } = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleStartGame = (mode: GameMode, playerName: string) => {
    startGame(mode, playerName);
  };

  const handleQuitGame = () => {
    resetGame();
  };

  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
  };

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
  };

  if (showLeaderboard) {
    return <Leaderboard onClose={handleCloseLeaderboard} />;
  }

  if (gameConfig && gameConfig.state === GameState.PLAYING) {
    return <Game onQuit={handleQuitGame} />;
  }

  return (
    <Menu
      onStartGame={handleStartGame}
      onShowLeaderboard={handleShowLeaderboard}
    />
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <GameProvider>
        <div className="app">
          <AppContent />
        </div>
      </GameProvider>
    </AuthProvider>
  );
};

export default App;
