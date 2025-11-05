import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types/game';
import { getLeaderboard } from '../services/firebase';
import './Leaderboard.css';

interface LeaderboardProps {
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(10);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="leaderboard-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <p>No leaderboard entries yet.</p>
              <p>Be the first to play and set a record!</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {entries.map((entry, index) => (
                <div key={entry.id} className={`leaderboard-entry ${index < 3 ? 'top-three' : ''}`}>
                  <div className="rank">{getMedalEmoji(index + 1)}</div>
                  <div className="player-details">
                    <div className="player-name">{entry.username}</div>
                    <div className="player-stats">
                      W: {entry.wins} | L: {entry.losses}
                    </div>
                  </div>
                  <div className="player-score">{entry.score}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="leaderboard-footer">
          <button className="menu-button primary" onClick={onClose}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
