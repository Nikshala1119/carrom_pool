import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { useAuth } from '../context/AuthContext';
import './Menu.css';

interface MenuProps {
  onStartGame: (mode: GameMode, playerName: string) => void;
  onShowLeaderboard: () => void;
}

const Menu: React.FC<MenuProps> = ({ onStartGame, onShowLeaderboard }) => {
  const { user, signInAsGuest, signOut } = useAuth();
  const [playerName, setPlayerName] = useState(user?.displayName || 'Player 1');
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    setShowNameInput(true);
  };

  const handleStartGame = () => {
    if (selectedMode) {
      onStartGame(selectedMode, playerName);
    }
  };

  const handleBack = () => {
    setShowNameInput(false);
    setSelectedMode(null);
  };

  const handleSignIn = async () => {
    try {
      await signInAsGuest();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="menu-container">
        <div className="menu-card">
          <h1 className="game-title">🎯 Carrom Pool</h1>
          <p className="game-subtitle">Experience realistic carrom physics</p>
          <button className="menu-button primary" onClick={handleSignIn}>
            Play as Guest
          </button>
        </div>
      </div>
    );
  }

  if (showNameInput && selectedMode) {
    return (
      <div className="menu-container">
        <div className="menu-card">
          <h2 className="menu-heading">
            {selectedMode === GameMode.SINGLE_PLAYER ? 'Single Player' : 'Multiplayer'}
          </h2>
          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="text-input"
              maxLength={20}
            />
          </div>
          <div className="button-group">
            <button className="menu-button secondary" onClick={handleBack}>
              Back
            </button>
            <button
              className="menu-button primary"
              onClick={handleStartGame}
              disabled={!playerName.trim()}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <div className="menu-card">
        <h1 className="game-title">🎯 Carrom Pool</h1>
        <p className="game-subtitle">Welcome, {user.displayName}!</p>

        <div className="menu-buttons">
          <button
            className="menu-button primary"
            onClick={() => handleModeSelect(GameMode.SINGLE_PLAYER)}
          >
            <div className="button-icon">🤖</div>
            <div className="button-text">
              <div className="button-title">Single Player</div>
              <div className="button-description">Play against AI</div>
            </div>
          </button>

          <button
            className="menu-button primary"
            onClick={() => handleModeSelect(GameMode.MULTIPLAYER)}
          >
            <div className="button-icon">👥</div>
            <div className="button-text">
              <div className="button-title">Multiplayer</div>
              <div className="button-description">Play online with friends</div>
            </div>
          </button>

          <button className="menu-button secondary" onClick={onShowLeaderboard}>
            <div className="button-icon">🏆</div>
            <div className="button-text">
              <div className="button-title">Leaderboard</div>
              <div className="button-description">Top players</div>
            </div>
          </button>
        </div>

        <button className="logout-button" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Menu;
