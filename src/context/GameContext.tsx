import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameMode, GameState, PlayerTurn, Player, PieceType, GameConfig } from '../types/game';

interface GameContextType {
  gameConfig: GameConfig | null;
  startGame: (mode: GameMode, playerName: string) => void;
  endGame: () => void;
  switchTurn: () => void;
  updateScore: (player: PlayerTurn, points: number) => void;
  setPaused: (paused: boolean) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  const startGame = useCallback((mode: GameMode, playerName: string) => {
    const player1: Player = {
      id: 'player1',
      name: playerName,
      score: 0,
      piecesCollected: 0,
      hasQueen: false,
      color: PieceType.WHITE
    };

    const player2: Player = {
      id: 'player2',
      name: mode === GameMode.SINGLE_PLAYER ? 'AI Opponent' : 'Player 2',
      score: 0,
      piecesCollected: 0,
      hasQueen: false,
      color: PieceType.BLACK
    };

    setGameConfig({
      mode,
      player1,
      player2,
      currentTurn: PlayerTurn.PLAYER1,
      state: GameState.PLAYING
    });
  }, []);

  const endGame = useCallback(() => {
    if (gameConfig) {
      setGameConfig({
        ...gameConfig,
        state: GameState.GAME_OVER
      });
    }
  }, [gameConfig]);

  const switchTurn = useCallback(() => {
    if (gameConfig) {
      setGameConfig({
        ...gameConfig,
        currentTurn: gameConfig.currentTurn === PlayerTurn.PLAYER1
          ? PlayerTurn.PLAYER2
          : PlayerTurn.PLAYER1
      });
    }
  }, [gameConfig]);

  const updateScore = useCallback((player: PlayerTurn, points: number) => {
    if (gameConfig) {
      const playerKey = player === PlayerTurn.PLAYER1 ? 'player1' : 'player2';
      setGameConfig({
        ...gameConfig,
        [playerKey]: {
          ...gameConfig[playerKey],
          score: gameConfig[playerKey].score + points,
          piecesCollected: gameConfig[playerKey].piecesCollected + 1
        }
      });
    }
  }, [gameConfig]);

  const setPaused = useCallback((paused: boolean) => {
    if (gameConfig) {
      setGameConfig({
        ...gameConfig,
        state: paused ? GameState.PAUSED : GameState.PLAYING
      });
    }
  }, [gameConfig]);

  const resetGame = useCallback(() => {
    setGameConfig(null);
  }, []);

  const value: GameContextType = {
    gameConfig,
    startGame,
    endGame,
    switchTurn,
    updateScore,
    setPaused,
    resetGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
