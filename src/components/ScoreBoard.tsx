import React from 'react';
import { Player, PlayerTurn } from '../types/game';
import './ScoreBoard.css';

interface ScoreBoardProps {
  player1: Player;
  player2: Player;
  currentTurn: PlayerTurn;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ player1, player2, currentTurn }) => {
  return (
    <div className="scoreboard">
      <div className={`player-card ${currentTurn === PlayerTurn.PLAYER1 ? 'active' : ''}`}>
        <div className="player-indicator">
          <div className={`piece-indicator ${player1.color}`}></div>
        </div>
        <div className="player-info">
          <h3>{player1.name}</h3>
          <div className="score">{player1.score}</div>
          <div className="pieces-count">Pieces: {player1.piecesCollected}</div>
          {player1.hasQueen && <div className="queen-badge">👑 Queen</div>}
        </div>
      </div>

      <div className="vs-divider">VS</div>

      <div className={`player-card ${currentTurn === PlayerTurn.PLAYER2 ? 'active' : ''}`}>
        <div className="player-indicator">
          <div className={`piece-indicator ${player2.color}`}></div>
        </div>
        <div className="player-info">
          <h3>{player2.name}</h3>
          <div className="score">{player2.score}</div>
          <div className="pieces-count">Pieces: {player2.piecesCollected}</div>
          {player2.hasQueen && <div className="queen-badge">👑 Queen</div>}
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
