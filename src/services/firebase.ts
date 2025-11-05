import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { LeaderboardEntry, MultiplayerGame } from '../types/game';

// Leaderboard functions
export const updateLeaderboard = async (
  userId: string,
  username: string,
  score: number,
  won: boolean
) => {
  try {
    const leaderboardRef = doc(db, 'leaderboard', userId);
    const leaderboardDoc = await getDoc(leaderboardRef);

    if (leaderboardDoc.exists()) {
      const data = leaderboardDoc.data();
      await updateDoc(leaderboardRef, {
        score: data.score + score,
        wins: won ? data.wins + 1 : data.wins,
        losses: won ? data.losses : data.losses + 1,
        timestamp: Date.now()
      });
    } else {
      await setDoc(leaderboardRef, {
        userId,
        username,
        score,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

export const getLeaderboard = async (limitCount: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LeaderboardEntry));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

// Multiplayer game functions
export const createMultiplayerGame = async (
  player1Id: string,
  player1Name: string
): Promise<string> => {
  try {
    const gameRef = doc(collection(db, 'games'));
    const gameId = gameRef.id;

    await setDoc(gameRef, {
      id: gameId,
      player1Id,
      player1Name,
      player2Id: null,
      player2Name: null,
      currentTurn: 'player1',
      gameState: null,
      lastUpdate: serverTimestamp(),
      status: 'waiting'
    });

    return gameId;
  } catch (error) {
    console.error('Error creating multiplayer game:', error);
    throw error;
  }
};

export const joinMultiplayerGame = async (
  gameId: string,
  player2Id: string,
  player2Name: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      player2Id,
      player2Name,
      status: 'active',
      lastUpdate: serverTimestamp()
    });
  } catch (error) {
    console.error('Error joining multiplayer game:', error);
    throw error;
  }
};

export const findAvailableGame = async (): Promise<string | null> => {
  try {
    const gamesRef = collection(db, 'games');
    const q = query(
      gamesRef,
      where('status', '==', 'waiting'),
      orderBy('lastUpdate', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].id;
  } catch (error) {
    console.error('Error finding available game:', error);
    return null;
  }
};

export const updateGameState = async (
  gameId: string,
  gameState: any,
  currentTurn: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      gameState,
      currentTurn,
      lastUpdate: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

export const subscribeToGame = (
  gameId: string,
  callback: (game: MultiplayerGame) => void
): Unsubscribe => {
  const gameRef = doc(db, 'games', gameId);

  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as MultiplayerGame);
    }
  });
};

export const endMultiplayerGame = async (
  gameId: string,
  winnerId: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      status: 'completed',
      winner: winnerId,
      lastUpdate: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending multiplayer game:', error);
    throw error;
  }
};
