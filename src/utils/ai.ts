import { Piece, PieceType } from '../types/game';
import { BOARD_SIZE, STRIKER_LINE_Y_PLAYER2 } from './physics';

export interface AIMove {
  strikerX: number;
  angle: number;
  power: number;
}

// AI difficulty levels
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export const calculateAIMove = (
  pieces: Piece[],
  targetColor: PieceType,
  difficulty: AIDifficulty = AIDifficulty.MEDIUM
): AIMove => {
  // Filter available target pieces
  const targetPieces = pieces.filter(
    p => !p.pocketed && (p.type === targetColor || p.type === PieceType.QUEEN)
  );

  if (targetPieces.length === 0) {
    // No valid targets, return random shot
    return getRandomMove();
  }

  // Select target piece
  const targetPiece = selectBestTarget(targetPieces, difficulty);

  if (!targetPiece) {
    return getRandomMove();
  }

  // Calculate shot parameters (AI always shoots from Player 2 position - top)
  const strikerY = STRIKER_LINE_Y_PLAYER2;
  const targetX = targetPiece.body.position.x;
  const targetY = targetPiece.body.position.y;

  // Calculate optimal striker position
  let strikerX = calculateStrikerPosition(targetX, targetY, strikerY, difficulty);

  // Calculate angle to target
  const dx = targetX - strikerX;
  const dy = targetY - strikerY;
  let angle = Math.atan2(dy, dx);

  // Calculate power based on distance
  const distance = Math.sqrt(dx * dx + dy * dy);
  let power = calculatePower(distance, difficulty);

  // Add randomness based on difficulty
  const { angleVariation, powerVariation } = getDifficultyVariations(difficulty);

  angle += (Math.random() - 0.5) * angleVariation;
  power += (Math.random() - 0.5) * powerVariation;

  // Clamp values
  power = Math.max(20, Math.min(100, power));

  return {
    strikerX,
    angle,
    power
  };
};

const selectBestTarget = (pieces: Piece[], difficulty: AIDifficulty): Piece | null => {
  if (pieces.length === 0) return null;

  // Easy: Random selection
  if (difficulty === AIDifficulty.EASY) {
    return pieces[Math.floor(Math.random() * pieces.length)];
  }

  // Medium/Hard: Select closest piece to striker line (AI at top)
  const strikerY = STRIKER_LINE_Y_PLAYER2;

  let bestPiece = pieces[0];
  let bestScore = Infinity;

  for (const piece of pieces) {
    // Prefer pieces closer to striker and near pockets
    const distanceToStriker = Math.abs(piece.body.position.y - strikerY);
    const distanceToPocket = getDistanceToNearestPocket(
      piece.body.position.x,
      piece.body.position.y
    );

    let score = distanceToStriker;

    // Medium: Simple distance-based selection
    if (difficulty === AIDifficulty.MEDIUM) {
      score = distanceToStriker + distanceToPocket * 0.5;
    }

    // Hard: Consider pocket proximity more
    if (difficulty === AIDifficulty.HARD) {
      score = distanceToStriker * 0.7 + distanceToPocket * 0.3;
      // Prefer queen if available
      if (piece.type === PieceType.QUEEN) {
        score *= 0.8;
      }
    }

    if (score < bestScore) {
      bestScore = score;
      bestPiece = piece;
    }
  }

  return bestPiece;
};

const calculateStrikerPosition = (
  targetX: number,
  targetY: number,
  strikerY: number,
  difficulty: AIDifficulty
): number => {
  // Calculate position to aim at pocket through target
  const nearestPocket = getNearestPocket(targetX, targetY);

  // Vector from target to pocket
  const dx = nearestPocket.x - targetX;
  const dy = nearestPocket.y - targetY;

  // Calculate where striker should be to hit target towards pocket
  const ratio = (strikerY - targetY) / dy;
  let strikerX = targetX - dx * ratio;

  // Add variation based on difficulty
  if (difficulty === AIDifficulty.EASY) {
    strikerX += (Math.random() - 0.5) * 100;
  } else if (difficulty === AIDifficulty.MEDIUM) {
    strikerX += (Math.random() - 0.5) * 50;
  }

  // Ensure striker is within bounds
  const minX = 80;
  const maxX = BOARD_SIZE - 80;
  strikerX = Math.max(minX, Math.min(maxX, strikerX));

  return strikerX;
};

const calculatePower = (distance: number, difficulty: AIDifficulty): number => {
  let basePower = 50 + (distance / 10);

  if (difficulty === AIDifficulty.EASY) {
    basePower *= 0.8;
  } else if (difficulty === AIDifficulty.HARD) {
    basePower *= 1.1;
  }

  return basePower;
};

const getDifficultyVariations = (difficulty: AIDifficulty) => {
  switch (difficulty) {
    case AIDifficulty.EASY:
      return { angleVariation: 0.3, powerVariation: 30 };
    case AIDifficulty.MEDIUM:
      return { angleVariation: 0.15, powerVariation: 15 };
    case AIDifficulty.HARD:
      return { angleVariation: 0.05, powerVariation: 5 };
    default:
      return { angleVariation: 0.15, powerVariation: 15 };
  }
};

const getRandomMove = (): AIMove => {
  return {
    strikerX: BOARD_SIZE / 2 + (Math.random() - 0.5) * 200,
    angle: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3,
    power: 50 + Math.random() * 30
  };
};

const getNearestPocket = (x: number, y: number) => {
  const pockets = [
    { x: 50, y: 50 },
    { x: BOARD_SIZE - 50, y: 50 },
    { x: 50, y: BOARD_SIZE - 50 },
    { x: BOARD_SIZE - 50, y: BOARD_SIZE - 50 }
  ];

  let nearest = pockets[0];
  let minDist = Infinity;

  for (const pocket of pockets) {
    const dist = Math.sqrt(
      Math.pow(x - pocket.x, 2) + Math.pow(y - pocket.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = pocket;
    }
  }

  return nearest;
};

const getDistanceToNearestPocket = (x: number, y: number): number => {
  const nearest = getNearestPocket(x, y);
  return Math.sqrt(
    Math.pow(x - nearest.x, 2) + Math.pow(y - nearest.y, 2)
  );
};
