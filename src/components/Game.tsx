import React, { useState, useCallback } from 'react';
import { GameMode, PlayerTurn, PieceType } from '../types/game';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import GameBoard from './GameBoard';
import ScoreBoard from './ScoreBoard';
import { updateLeaderboard } from '../services/firebase';
import './Game.css';

interface GameProps {
  onQuit: () => void;
}

const Game: React.FC<GameProps> = ({ onQuit }) => {
  const { gameConfig, switchTurn, updateScore, endGame, resetGame } = useGame();
  const { user } = useAuth();
  const [isPaused, setIsPaused] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const handleScoreUpdate = useCallback((player: PlayerTurn, points: number, pieceType: PieceType) => {
    updateScore(player, points);

    // Check for queen
    if (pieceType === PieceType.QUEEN && gameConfig) {
      const playerKey = player === PlayerTurn.PLAYER1 ? 'player1' : 'player2';
      gameConfig[playerKey].hasQueen = true;
    }

    // Check for game over (simplified - can be enhanced)
    if (gameConfig) {
      const totalScore = gameConfig.player1.score + gameConfig.player2.score;
      if (totalScore > 200 || gameConfig.player1.piecesCollected + gameConfig.player2.piecesCollected >= 18) {
        handleGameOver();
      }
    }
  }, [gameConfig, updateScore]);

  const handleTurnEnd = useCallback(() => {
    switchTurn();
  }, [switchTurn]);

  const handleGameOver = async () => {
    if (!gameConfig || !user) return;

    endGame();

    const winner = gameConfig.player1.score > gameConfig.player2.score
      ? gameConfig.player1.name
      : gameConfig.player2.name;

    setWinner(winner);
    setShowGameOver(true);

    // Update leaderboard
    const playerWon = gameConfig.player1.score > gameConfig.player2.score;
    try {
      await updateLeaderboard(
        user.uid,
        user.displayName || 'Guest',
        gameConfig.player1.score,
        playerWon
      );
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  };

  const handlePlayAgain = () => {
    setShowGameOver(false);
    setWinner(null);
    resetGame();
    onQuit();
  };

  if (!gameConfig) {
    return null;
  }

  const isAITurn = gameConfig.mode === GameMode.SINGLE_PLAYER &&
    gameConfig.currentTurn === PlayerTurn.PLAYER2;

  return (
    <div className="game-container">
      <div className="game-header">
        <button className="icon-button" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? '▶️' : '⏸️'}
        </button>
        <h2 className="game-title-small">Carrom Pool</h2>
        <button className="icon-button" onClick={onQuit}>
          ❌
        </button>
      </div>

      <ScoreBoard
        player1={gameConfig.player1}
        player2={gameConfig.player2}
        currentTurn={gameConfig.currentTurn}
      />

      {!isPaused && !showGameOver && (
        <GameBoard
          onScoreUpdate={handleScoreUpdate}
          onTurnEnd={handleTurnEnd}
          isAITurn={isAITurn}
          currentTurn={gameConfig.currentTurn}
        />
      )}

      {isPaused && (
        <div className="overlay">
          <div className="pause-menu">
            <h2>Game Paused</h2>
            <button className="menu-button primary" onClick={() => setIsPaused(false)}>
              Resume
            </button>
            <button className="menu-button secondary" onClick={onQuit}>
              Quit to Menu
            </button>
          </div>
        </div>
      )}

      {showGameOver && (
        <div className="overlay">
          <div className="game-over-menu">
            <h2>🎉 Game Over!</h2>
            <div className="winner-announcement">
              <p className="winner-text">{winner} Wins!</p>
              <div className="final-scores">
                <div className="final-score-item">
                  <span>{gameConfig.player1.name}:</span>
                  <span className="score-value">{gameConfig.player1.score}</span>
                </div>
                <div className="final-score-item">
                  <span>{gameConfig.player2.name}:</span>
                  <span className="score-value">{gameConfig.player2.score}</span>
                </div>
              </div>
            </div>
            <div className="button-group">
              <button className="menu-button primary" onClick={handlePlayAgain}>
                Play Again
              </button>
              <button className="menu-button secondary" onClick={onQuit}>
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
