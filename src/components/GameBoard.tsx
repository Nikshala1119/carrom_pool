import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Piece, PieceType, PlayerTurn } from '../types/game';
import {
  createEngine,
  setupBoard,
  createBoardBoundaries,
  createPiece,
  applyStrikerForce,
  checkPocketed,
  resetStrikerPosition,
  arePiecesStationary,
  BOARD_SIZE,
  STRIKER_LINE_Y,
  POCKET_POSITIONS,
  POCKET_RADIUS
} from '../utils/physics';
import { calculateAIMove, AIDifficulty } from '../utils/ai';
import { useGame } from '../context/GameContext';
import './GameBoard.css';

interface GameBoardProps {
  onScoreUpdate: (player: PlayerTurn, points: number, pieceType: PieceType) => void;
  onTurnEnd: () => void;
  isAITurn: boolean;
  currentTurn: PlayerTurn;
}

const GameBoard: React.FC<GameBoardProps> = ({
  onScoreUpdate,
  onTurnEnd,
  isAITurn,
  currentTurn
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const piecesRef = useRef<Piece[]>([]);
  const strikerRef = useRef<Piece | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [strikerPosition, setStrikerPosition] = useState({ x: BOARD_SIZE / 2, y: STRIKER_LINE_Y });
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [power, setPower] = useState(0);
  const [canShoot, setCanShoot] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const { gameConfig } = useGame();

  // Initialize physics engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = createEngine();
    engineRef.current = engine;

    // Setup canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup board pieces
    const pieces = setupBoard();
    piecesRef.current = pieces;

    // Create striker
    const striker = createPiece(
      strikerPosition.x,
      strikerPosition.y,
      PieceType.STRIKER,
      'striker'
    );
    strikerRef.current = striker;

    // Add all bodies to world
    const walls = createBoardBoundaries();
    Matter.World.add(engine.world, [...walls, ...pieces.map(p => p.body), striker.body]);

    // Create runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Custom render loop
    const render = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#d4a574';
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Draw board border
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, BOARD_SIZE - 10, BOARD_SIZE - 10);

      // Draw center circle
      ctx.beginPath();
      ctx.arc(BOARD_SIZE / 2, BOARD_SIZE / 2, 60, 0, Math.PI * 2);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw pockets
      POCKET_POSITIONS.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
      });

      // Draw striker line
      ctx.beginPath();
      ctx.moveTo(50, STRIKER_LINE_Y);
      ctx.lineTo(BOARD_SIZE - 50, STRIKER_LINE_Y);
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw pieces
      piecesRef.current.forEach(piece => {
        if (!piece.pocketed) {
          const { x, y } = piece.body.position;
          ctx.beginPath();
          ctx.arc(x, y, 15, 0, Math.PI * 2);
          ctx.fillStyle = piece.body.render.fillStyle as string;
          ctx.fill();
          ctx.strokeStyle = piece.body.render.strokeStyle as string;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw striker
      if (strikerRef.current && !strikerRef.current.pocketed) {
        const { x, y } = strikerRef.current.body.position;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = strikerRef.current.body.render.fillStyle as string;
        ctx.fill();
        ctx.strokeStyle = strikerRef.current.body.render.strokeStyle as string;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw aim line when aiming
      if (canShoot && !isAnimating && !isAITurn && strikerRef.current) {
        const striker = strikerRef.current.body.position;
        const aimLength = Math.min(power * 2, 200);
        const endX = striker.x + Math.cos(aimAngle) * aimLength;
        const endY = striker.y + Math.sin(aimAngle) * aimLength;

        ctx.beginPath();
        ctx.moveTo(striker.x, striker.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw power indicator
        ctx.beginPath();
        ctx.arc(striker.x, striker.y, 25 + power / 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + power / 200})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      requestAnimationFrame(render);
    };

    render();

    return () => {
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  // Check for pocketed pieces
  useEffect(() => {
    if (!engineRef.current || isAnimating) return;

    const checkInterval = setInterval(() => {
      let piecePocketed = false;

      // Check all pieces
      piecesRef.current.forEach(piece => {
        if (!piece.pocketed && checkPocketed(piece.body)) {
          piece.pocketed = true;
          Matter.World.remove(engineRef.current!.world, piece.body);

          // Award points
          let points = 0;
          if (piece.type === PieceType.WHITE) points = 10;
          else if (piece.type === PieceType.BLACK) points = 20;
          else if (piece.type === PieceType.QUEEN) points = 50;

          onScoreUpdate(currentTurn, points, piece.type);
          piecePocketed = true;
        }
      });

      // Check striker
      if (strikerRef.current && !strikerRef.current.pocketed && checkPocketed(strikerRef.current.body)) {
        strikerRef.current.pocketed = true;
        onScoreUpdate(currentTurn, -10, PieceType.STRIKER);
        resetStrikerPosition(strikerRef.current.body);
        strikerRef.current.pocketed = false;
      }

      // Check if all pieces are stationary
      if (isAnimating && arePiecesStationary([...piecesRef.current, strikerRef.current!])) {
        setIsAnimating(false);
        setCanShoot(true);

        if (!piecePocketed) {
          // No piece pocketed, end turn
          setTimeout(onTurnEnd, 500);
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [isAnimating, currentTurn, onScoreUpdate, onTurnEnd]);

  // AI turn handler
  useEffect(() => {
    if (isAITurn && canShoot && !isAnimating && strikerRef.current) {
      setTimeout(() => {
        const targetColor = gameConfig?.player2.color === PieceType.WHITE
          ? PieceType.WHITE
          : PieceType.BLACK;

        const aiMove = calculateAIMove(piecesRef.current, targetColor, AIDifficulty.MEDIUM);

        // Position striker
        Matter.Body.setPosition(strikerRef.current!.body, {
          x: aiMove.strikerX,
          y: STRIKER_LINE_Y
        });

        // Shoot
        setTimeout(() => {
          applyStrikerForce(strikerRef.current!.body, aiMove.angle, aiMove.power);
          setIsAnimating(true);
          setCanShoot(false);
        }, 500);
      }, 1000);
    }
  }, [isAITurn, canShoot, isAnimating, gameConfig]);

  // Mouse/Touch handlers for striker control
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canShoot || isAnimating || isAITurn) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;

    setIsDragging(true);
    setStrikerPosition({ x, y: STRIKER_LINE_Y });

    if (strikerRef.current) {
      Matter.Body.setPosition(strikerRef.current.body, { x, y: STRIKER_LINE_Y });
    }
  }, [canShoot, isAnimating, isAITurn]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !strikerRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const striker = strikerRef.current.body.position;

    // Calculate aim angle
    const dx = mouseX - striker.x;
    const dy = mouseY - striker.y;
    const angle = Math.atan2(dy, dx);
    setAimAngle(angle);

    // Calculate power
    const distance = Math.sqrt(dx * dx + dy * dy);
    const newPower = Math.min(Math.max(distance / 2, 20), 100);
    setPower(newPower);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging || !canShoot || !strikerRef.current) return;

    setIsDragging(false);

    if (power > 10) {
      applyStrikerForce(strikerRef.current.body, aimAngle, power);
      setIsAnimating(true);
      setCanShoot(false);
      setPower(0);
    }
  }, [isDragging, canShoot, power, aimAngle]);

  return (
    <div className="game-board-container">
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        className="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {!canShoot && <div className="turn-indicator">Pieces in motion...</div>}
      {isAITurn && <div className="turn-indicator">AI is thinking...</div>}
    </div>
  );
};

export default GameBoard;
