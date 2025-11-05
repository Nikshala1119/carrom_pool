import { Body } from 'matter-js';

export enum PieceType {
  WHITE = 'white',
  BLACK = 'black',
  QUEEN = 'queen',
  STRIKER = 'striker'
}

export enum PieceColor {
  WHITE = '#FFFFFF',
  BLACK = '#000000',
  QUEEN = '#FF1744',
  STRIKER = '#4CAF50'
}

export interface Piece {
  id: string;
  type: PieceType;
  body: Body;
  pocketed: boolean;
}

export enum GameMode {
  SINGLE_PLAYER = 'single',
  MULTIPLAYER = 'multiplayer'
}

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over'
}

export enum PlayerTurn {
  PLAYER1 = 'player1',
  PLAYER2 = 'player2'
}

export interface Player {
  id: string;
  name: string;
  score: number;
  piecesCollected: number;
  hasQueen: boolean;
  color: PieceType.WHITE | PieceType.BLACK;
}

export interface GameConfig {
  mode: GameMode;
  player1: Player;
  player2: Player;
  currentTurn: PlayerTurn;
  state: GameState;
}

export interface StrikerControl {
  position: { x: number; y: number };
  angle: number;
  power: number;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  wins: number;
  losses: number;
  timestamp: number;
}

export interface MultiplayerGame {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  currentTurn: PlayerTurn;
  gameState: any;
  lastUpdate: number;
  winner?: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
