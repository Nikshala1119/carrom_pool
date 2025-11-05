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
  getStrikerLineY,
  BOARD_SIZE,
  STRIKER_LINE_Y_PLAYER1,
  STRIKER_LINE_Y_PLAYER2,
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
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [power, setPower] = useState(0);
  const [canShoot, setCanShoot] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const piecePocketedThisTurnRef = useRef(false);
  const shotTakenThisTurnRef = useRef(false);

  const { gameConfig } = useGame();

  // Determine whose turn and calculate striker position
  const isPlayer1Turn = currentTurn === PlayerTurn.PLAYER1;
  const strikerLineY = getStrikerLineY(isPlayer1Turn);

  // Striker line area bounds - changes based on player
  const STRIKER_AREA_MIN_Y = isPlayer1Turn ? strikerLineY - 50 : strikerLineY - 10;
  const STRIKER_AREA_MAX_Y = isPlayer1Turn ? BOARD_SIZE : strikerLineY + 50;

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

    // Create striker at Player 1's position initially
    const striker = createPiece(
      BOARD_SIZE / 2,
      STRIKER_LINE_Y_PLAYER1,
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

      // Get current turn info for rendering
      const currentIsPlayer1 = currentTurn === PlayerTurn.PLAYER1;
      const currentStrikerLineY = getStrikerLineY(currentIsPlayer1);
      const currentStrikerMinY = currentIsPlayer1 ? currentStrikerLineY - 50 : currentStrikerLineY - 10;
      const currentStrikerMaxY = currentIsPlayer1 ? BOARD_SIZE : currentStrikerLineY + 50;

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

      // Draw striker line area (clickable region for positioning)
      if (canShoot && !isAnimating && !isAITurn) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.fillRect(0, currentStrikerMinY, BOARD_SIZE, currentStrikerMaxY - currentStrikerMinY);

        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, currentStrikerMinY, BOARD_SIZE, currentStrikerMaxY - currentStrikerMinY);
      }

      // Draw striker line for current player
      ctx.beginPath();
      ctx.moveTo(50, currentStrikerLineY);
      ctx.lineTo(BOARD_SIZE - 50, currentStrikerLineY);
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
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

      // Draw aim line when player can shoot
      if (canShoot && !isAnimating && !isAITurn && strikerRef.current) {
        const striker = strikerRef.current.body.position;

        // Show aim line (either during drag or default hint)
        if (isDragging || power > 0) {
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
        } else {
          // Show default hint arrow - direction based on player
          const hintLength = 80;
          const endX = striker.x;
          const endY = currentIsPlayer1
            ? striker.y - hintLength  // Player 1: aim upward
            : striker.y + hintLength; // Player 2: aim downward

          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw arrow head
          if (currentIsPlayer1) {
            // Arrow pointing up
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - 10, endY + 15);
            ctx.lineTo(endX + 10, endY + 15);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.fill();
          } else {
            // Arrow pointing down
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - 10, endY - 15);
            ctx.lineTo(endX + 10, endY - 15);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.fill();
          }

          // Pulsing circle hint
          const pulseSize = 30 + Math.sin(Date.now() / 300) * 5;
          ctx.beginPath();
          ctx.arc(striker.x, striker.y, pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
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

  // Update striker position when turn changes
  useEffect(() => {
    if (strikerRef.current && canShoot && !isAnimating) {
      resetStrikerPosition(strikerRef.current.body, isPlayer1Turn);

      // Reset aim angle based on player direction
      setAimAngle(isPlayer1Turn ? -Math.PI / 2 : Math.PI / 2);
      setPower(0);
      setIsDragging(false);

      // Reset turn flags when turn changes
      piecePocketedThisTurnRef.current = false;
      shotTakenThisTurnRef.current = false;
    }
  }, [currentTurn, canShoot, isAnimating, isPlayer1Turn]);

  // Check for pocketed pieces
  useEffect(() => {
    if (!engineRef.current) return;

    const checkInterval = setInterval(() => {
      // Get current player's color
      const currentPlayerColor = gameConfig
        ? (currentTurn === PlayerTurn.PLAYER1 ? gameConfig.player1.color : gameConfig.player2.color)
        : PieceType.WHITE;

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

          // Only continue turn if player pocketed their own color or queen
          if (piece.type === currentPlayerColor || piece.type === PieceType.QUEEN) {
            piecePocketedThisTurnRef.current = true;
          }
        }
      });

      // Check striker
      if (strikerRef.current && !strikerRef.current.pocketed && checkPocketed(strikerRef.current.body)) {
        strikerRef.current.pocketed = true;
        onScoreUpdate(currentTurn, -10, PieceType.STRIKER);
        resetStrikerPosition(strikerRef.current.body, isPlayer1Turn);
        strikerRef.current.pocketed = false;
      }

      // Check if all pieces are stationary
      if (isAnimating && arePiecesStationary([...piecesRef.current, strikerRef.current!])) {
        setIsAnimating(false);
        setCanShoot(true);

        // Only end turn if shot was taken AND no piece was pocketed
        if (shotTakenThisTurnRef.current && !piecePocketedThisTurnRef.current) {
          // No piece pocketed, end turn
          setTimeout(onTurnEnd, 500);
        }

        // Reset pocketed flag for next shot (but keep shotTaken until turn changes)
        piecePocketedThisTurnRef.current = false;
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

        // Position striker at Player 2's line (top)
        Matter.Body.setPosition(strikerRef.current!.body, {
          x: aiMove.strikerX,
          y: STRIKER_LINE_Y_PLAYER2
        });

        // Shoot
        setTimeout(() => {
          // Mark that a shot was taken this turn
          shotTakenThisTurnRef.current = true;
          piecePocketedThisTurnRef.current = false;
          applyStrikerForce(strikerRef.current!.body, aiMove.angle, aiMove.power);
          setIsAnimating(true);
          setCanShoot(false);
        }, 500);
      }, 1000);
    }
  }, [isAITurn, canShoot, isAnimating, gameConfig]);

  // Mouse/Touch handlers for striker control
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canShoot || isAnimating || isAITurn || !strikerRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const striker = strikerRef.current.body.position;

    // Check if clicking in striker line area (changes based on player)
    const isInStrikerArea = (isPlayer1Turn && clickY >= STRIKER_AREA_MIN_Y) ||
                           (!isPlayer1Turn && clickY <= STRIKER_AREA_MAX_Y);

    if (isInStrikerArea) {
      // Position striker on striker line at click X position
      const clampedX = Math.max(50, Math.min(BOARD_SIZE - 50, clickX));
      Matter.Body.setPosition(strikerRef.current.body, { x: clampedX, y: strikerLineY });
      // Reset velocity to prevent drift
      Matter.Body.setVelocity(strikerRef.current.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(strikerRef.current.body, 0);
    } else {
      // Start aiming from current striker position
      setIsDragging(true);

      // Calculate initial aim direction
      const dx = clickX - striker.x;
      const dy = clickY - striker.y;
      const angle = Math.atan2(dy, dx);
      setAimAngle(angle);

      // Calculate initial power
      const distance = Math.sqrt(dx * dx + dy * dy);
      const newPower = Math.min(Math.max(distance / 2, 20), 100);
      setPower(newPower);
    }
  }, [canShoot, isAnimating, isAITurn, isPlayer1Turn, strikerLineY, STRIKER_AREA_MIN_Y, STRIKER_AREA_MAX_Y]);

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
      // Mark that a shot was taken this turn
      shotTakenThisTurnRef.current = true;
      piecePocketedThisTurnRef.current = false;
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
      {!canShoot && !isAITurn && <div className="turn-indicator">Pieces in motion...</div>}
      {isAITurn && <div className="turn-indicator">AI is thinking...</div>}
      {canShoot && !isAITurn && !isDragging && (
        <div className="turn-indicator" style={{ backgroundColor: 'rgba(76, 175, 80, 0.9)' }}>
          {isPlayer1Turn
            ? "YOUR TURN (Bottom) - Click green area to position | Click and drag to shoot"
            : "PLAYER 2 TURN (Top) - Click green area to position | Click and drag to shoot"}
        </div>
      )}
      {isDragging && (
        <div className="turn-indicator" style={{ backgroundColor: 'rgba(33, 150, 243, 0.9)' }}>
          {isPlayer1Turn ? "Player 1" : "Player 2"} - Drag to aim | Release to shoot (Power: {Math.round(power)}%)
        </div>
      )}
    </div>
  );
};

export default GameBoard;
