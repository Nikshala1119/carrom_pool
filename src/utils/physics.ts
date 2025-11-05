import Matter from 'matter-js';
import { Piece, PieceType, PieceColor } from '../types/game';

// Physics constants
export const BOARD_SIZE = 600;
export const BOARD_PADDING = 50;
export const PIECE_RADIUS = 15;
export const STRIKER_RADIUS = 18;
export const POCKET_RADIUS = 30;
export const FRICTION = 0.05;  // Lower friction for smoother carrom feel
export const AIR_FRICTION = 0.15;  // Higher air resistance for realistic slowdown
export const RESTITUTION = 0.8;  // Slightly less bouncy
export const STRIKER_LINE_Y_PLAYER1 = BOARD_SIZE - 100;  // y=500, bottom player
export const STRIKER_LINE_Y_PLAYER2 = 100;  // y=100, top player

// Pocket positions (corners)
export const POCKET_POSITIONS = [
  { x: BOARD_PADDING, y: BOARD_PADDING },
  { x: BOARD_SIZE - BOARD_PADDING, y: BOARD_PADDING },
  { x: BOARD_PADDING, y: BOARD_SIZE - BOARD_PADDING },
  { x: BOARD_SIZE - BOARD_PADDING, y: BOARD_SIZE - BOARD_PADDING }
];

export const createEngine = () => {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 0 }
  });
  return engine;
};

export const createRenderer = (canvas: HTMLCanvasElement, engine: Matter.Engine) => {
  const render = Matter.Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: BOARD_SIZE,
      height: BOARD_SIZE,
      wireframes: false,
      background: '#d4a574'
    }
  });
  return render;
};

export const createPiece = (x: number, y: number, type: PieceType, id: string): Piece => {
  const isStriker = type === PieceType.STRIKER;
  const radius = isStriker ? STRIKER_RADIUS : PIECE_RADIUS;

  let color: string;
  switch (type) {
    case PieceType.WHITE:
      color = PieceColor.WHITE;
      break;
    case PieceType.BLACK:
      color = PieceColor.BLACK;
      break;
    case PieceType.QUEEN:
      color = PieceColor.QUEEN;
      break;
    case PieceType.STRIKER:
      color = PieceColor.STRIKER;
      break;
    default:
      color = '#FFFFFF';
  }

  const body = Matter.Bodies.circle(x, y, radius, {
    restitution: RESTITUTION,
    friction: FRICTION,
    frictionAir: AIR_FRICTION,
    density: isStriker ? 0.008 : 0.005,  // Striker heavier than pieces
    inertia: Infinity,  // Prevent spinning for more predictable physics
    render: {
      fillStyle: color,
      strokeStyle: type === PieceType.QUEEN ? '#FFD700' : '#8B4513',
      lineWidth: 2
    },
    label: type
  });

  return {
    id,
    type,
    body,
    pocketed: false
  };
};

export const setupBoard = () => {
  const pieces: Piece[] = [];
  const centerX = BOARD_SIZE / 2;
  const centerY = BOARD_SIZE / 2;
  const offset = PIECE_RADIUS * 2 + 2;

  // Create center formation
  // Queen in center
  pieces.push(createPiece(centerX, centerY, PieceType.QUEEN, 'queen'));

  // First ring around queen (6 pieces alternating)
  const ring1Radius = offset;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = centerX + Math.cos(angle) * ring1Radius;
    const y = centerY + Math.sin(angle) * ring1Radius;
    const type = i % 2 === 0 ? PieceType.WHITE : PieceType.BLACK;
    pieces.push(createPiece(x, y, type, `${type}-ring1-${i}`));
  }

  // Second ring (12 pieces alternating)
  const ring2Radius = offset * 1.75;
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const x = centerX + Math.cos(angle) * ring2Radius;
    const y = centerY + Math.sin(angle) * ring2Radius;
    const type = i % 2 === 0 ? PieceType.BLACK : PieceType.WHITE;
    pieces.push(createPiece(x, y, type, `${type}-ring2-${i}`));
  }

  return pieces;
};

export const createBoardBoundaries = () => {
  const thickness = 20;
  const walls = [
    // Top wall
    Matter.Bodies.rectangle(
      BOARD_SIZE / 2,
      BOARD_PADDING / 2,
      BOARD_SIZE - BOARD_PADDING * 2,
      thickness,
      { isStatic: true, render: { fillStyle: '#8B4513' }, label: 'wall' }
    ),
    // Bottom wall
    Matter.Bodies.rectangle(
      BOARD_SIZE / 2,
      BOARD_SIZE - BOARD_PADDING / 2,
      BOARD_SIZE - BOARD_PADDING * 2,
      thickness,
      { isStatic: true, render: { fillStyle: '#8B4513' }, label: 'wall' }
    ),
    // Left wall
    Matter.Bodies.rectangle(
      BOARD_PADDING / 2,
      BOARD_SIZE / 2,
      thickness,
      BOARD_SIZE - BOARD_PADDING * 2,
      { isStatic: true, render: { fillStyle: '#8B4513' }, label: 'wall' }
    ),
    // Right wall
    Matter.Bodies.rectangle(
      BOARD_SIZE - BOARD_PADDING / 2,
      BOARD_SIZE / 2,
      thickness,
      BOARD_SIZE - BOARD_PADDING * 2,
      { isStatic: true, render: { fillStyle: '#8B4513' }, label: 'wall' }
    )
  ];

  return walls;
};

export const applyStrikerForce = (striker: Matter.Body, angle: number, power: number) => {
  // Increased force multiplier for more responsive gameplay
  // Power ranges from 20-100, this gives forces of 0.4 to 2.0
  const forceMagnitude = power * 0.02;
  const force = {
    x: Math.cos(angle) * forceMagnitude,
    y: Math.sin(angle) * forceMagnitude
  };
  Matter.Body.applyForce(striker, striker.position, force);
};

export const checkPocketed = (piece: Matter.Body): boolean => {
  const { x, y } = piece.position;

  for (const pocket of POCKET_POSITIONS) {
    const distance = Math.sqrt(
      Math.pow(x - pocket.x, 2) + Math.pow(y - pocket.y, 2)
    );

    if (distance < POCKET_RADIUS) {
      return true;
    }
  }

  return false;
};

export const getStrikerLineY = (isPlayer1: boolean): number => {
  return isPlayer1 ? STRIKER_LINE_Y_PLAYER1 : STRIKER_LINE_Y_PLAYER2;
};

export const isStrikerInValidPosition = (x: number, y: number, strikerY: number): boolean => {
  const minX = BOARD_PADDING + STRIKER_RADIUS;
  const maxX = BOARD_SIZE - BOARD_PADDING - STRIKER_RADIUS;
  const tolerance = 20;

  return (
    x >= minX &&
    x <= maxX &&
    Math.abs(y - strikerY) < tolerance
  );
};

export const resetStrikerPosition = (striker: Matter.Body, isPlayer1: boolean) => {
  const strikerY = getStrikerLineY(isPlayer1);
  Matter.Body.setPosition(striker, { x: BOARD_SIZE / 2, y: strikerY });
  Matter.Body.setVelocity(striker, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(striker, 0);
};

export const arePiecesStationary = (pieces: Piece[]): boolean => {
  return pieces.every(piece => {
    if (piece.pocketed) return true;
    const velocity = piece.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const angularSpeed = Math.abs(piece.body.angularVelocity);
    // Piece is stationary if both linear and angular velocity are very low
    return speed < 0.05 && angularSpeed < 0.01;
  });
};
