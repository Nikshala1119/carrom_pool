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
  const strikerP1Ref = useRef<Piece | null>(null);  // Green striker for Player 1
  const strikerP2Ref = useRef<Piece | null>(null);  // Blue striker for Player 2/AI

  const [isDragging, setIsDragging] = useState(false);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [power, setPower] = useState(0);
  const [canShoot, setCanShoot] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const piecePocketedThisTurnRef = useRef(false);
  const shotTakenThisTurnRef = useRef(false);
  const aiTurnInProgressRef = useRef(false);  // Track if AI is currently taking a turn

  const { gameConfig } = useGame();

  // Determine whose turn and calculate striker position
  const isPlayer1Turn = currentTurn === PlayerTurn.PLAYER1;
  const strikerLineY = getStrikerLineY(isPlayer1Turn);

  // Get current striker based on turn
  const currentStrikerRef = isPlayer1Turn ? strikerP1Ref : strikerP2Ref;

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

    // Create BOTH strikers (one for each player)
    const strikerP1 = createPiece(
      BOARD_SIZE / 2,
      STRIKER_LINE_Y_PLAYER1,
      PieceType.STRIKER_P1,
      'striker_p1'
    );
    strikerP1Ref.current = strikerP1;

    const strikerP2 = createPiece(
      BOARD_SIZE / 2,
      STRIKER_LINE_Y_PLAYER2,
      PieceType.STRIKER_P2,
      'striker_p2'
    );
    strikerP2Ref.current = strikerP2;

    // Hide Player 2 striker initially (Player 1 goes first)
    strikerP2.body.collisionFilter = { ...strikerP2.body.collisionFilter, group: -1 };

    // Add all bodies to world
    const walls = createBoardBoundaries();
    Matter.World.add(engine.world, [...walls, ...pieces.map(p => p.body), strikerP1.body, strikerP2.body]);

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

      // Draw both strikers, but only the active one
      // Player 1 striker (green) - visible when it's P1's turn or when animating P1's shot
      if (strikerP1Ref.current && !strikerP1Ref.current.pocketed) {
        const isP1Active = strikerP1Ref.current.body.collisionFilter.group === 0;
        if (isP1Active) {
          const { x, y } = strikerP1Ref.current.body.position;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, Math.PI * 2);
          ctx.fillStyle = strikerP1Ref.current.body.render.fillStyle as string;
          ctx.fill();
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // Player 2 striker (blue) - visible when it's P2's turn or when animating P2's shot
      if (strikerP2Ref.current && !strikerP2Ref.current.pocketed) {
        const isP2Active = strikerP2Ref.current.body.collisionFilter.group === 0;
        if (isP2Active) {
          const { x, y } = strikerP2Ref.current.body.position;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, Math.PI * 2);
          ctx.fillStyle = strikerP2Ref.current.body.render.fillStyle as string;
          ctx.fill();
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // Draw aim line when player can shoot
      if (canShoot && !isAnimating && !isAITurn && currentStrikerRef.current) {
        const striker = currentStrikerRef.current.body.position;

        // Show aim line (either during drag or default hint)
        if (isDragging || power > 0) {
          // INTERACTIVE AIM ARROW - rotates and extends based on aim
          const baseLength = 50;
          const maxLength = 200;
          const aimLength = baseLength + (power / 100) * (maxLength - baseLength);

          const endX = striker.x + Math.cos(aimAngle) * aimLength;
          const endY = striker.y + Math.sin(aimAngle) * aimLength;

          // Draw main aim line
          ctx.beginPath();
          ctx.moveTo(striker.x, striker.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + power / 250})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Draw arrow head pointing in aim direction
          const arrowSize = 15;
          const arrowAngle = Math.PI / 6; // 30 degrees

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowSize * Math.cos(aimAngle - arrowAngle),
            endY - arrowSize * Math.sin(aimAngle - arrowAngle)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowSize * Math.cos(aimAngle + arrowAngle),
            endY - arrowSize * Math.sin(aimAngle + arrowAngle)
          );
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.7 + power / 200})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          // Draw power indicator circle
          ctx.beginPath();
          ctx.arc(striker.x, striker.y, 25 + power / 4, 0, Math.PI * 2);
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
    if (strikerP1Ref.current && strikerP2Ref.current && canShoot && !isAnimating) {
      // Reset AI turn flag
      aiTurnInProgressRef.current = false;

      // Activate current player's striker, deactivate the other
      if (isPlayer1Turn) {
        // Player 1's turn
        strikerP1Ref.current.body.collisionFilter = { ...strikerP1Ref.current.body.collisionFilter, group: 0 };
        strikerP2Ref.current.body.collisionFilter = { ...strikerP2Ref.current.body.collisionFilter, group: -1 };
        resetStrikerPosition(strikerP1Ref.current.body, true);
      } else {
        // Player 2's turn
        strikerP2Ref.current.body.collisionFilter = { ...strikerP2Ref.current.body.collisionFilter, group: 0 };
        strikerP1Ref.current.body.collisionFilter = { ...strikerP1Ref.current.body.collisionFilter, group: -1 };
        resetStrikerPosition(strikerP2Ref.current.body, false);
      }

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

      // Check current striker
      const currentStriker = currentStrikerRef.current;
      if (currentStriker && !currentStriker.pocketed && checkPocketed(currentStriker.body)) {
        currentStriker.pocketed = true;
        onScoreUpdate(currentTurn, -10, PieceType.STRIKER);
        resetStrikerPosition(currentStriker.body, isPlayer1Turn);
        currentStriker.pocketed = false;
      }

      // Check if all pieces are stationary (including current striker)
      if (isAnimating && currentStrikerRef.current && arePiecesStationary([...piecesRef.current, currentStrikerRef.current])) {
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

  // AI turn handler with proper timing
  useEffect(() => {
    // Only trigger if:
    // 1. It's AI's turn
    // 2. Can shoot (pieces are stationary)
    // 3. Not currently animating
    // 4. AI turn not already in progress
    // 5. Striker exists
    if (isAITurn && canShoot && !isAnimating && !aiTurnInProgressRef.current && strikerP2Ref.current) {
      // Mark AI turn as in progress to prevent duplicate triggers
      aiTurnInProgressRef.current = true;

      console.log('AI turn starting...');

      // AI thinking delay
      const thinkingTimeout = setTimeout(() => {
        // Verify conditions are still valid
        if (!strikerP2Ref.current || !canShoot) {
          console.log('AI turn cancelled - conditions changed');
          aiTurnInProgressRef.current = false;
          return;
        }

        const targetColor = gameConfig?.player2.color === PieceType.WHITE
          ? PieceType.WHITE
          : PieceType.BLACK;

        const aiMove = calculateAIMove(piecesRef.current, targetColor, AIDifficulty.MEDIUM);

        console.log('AI positioning striker...');
        // Position Player 2's striker (blue) at top
        Matter.Body.setPosition(strikerP2Ref.current.body, {
          x: aiMove.strikerX,
          y: STRIKER_LINE_Y_PLAYER2
        });

        // Reset velocity
        Matter.Body.setVelocity(strikerP2Ref.current.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(strikerP2Ref.current.body, 0);

        // AI shooting delay
        const shootTimeout = setTimeout(() => {
          // Final check before shooting
          if (!strikerP2Ref.current || !canShoot) {
            console.log('AI shot cancelled - conditions changed');
            aiTurnInProgressRef.current = false;
            return;
          }

          console.log('AI shooting...');
          // Mark that a shot was taken this turn
          shotTakenThisTurnRef.current = true;
          piecePocketedThisTurnRef.current = false;

          applyStrikerForce(strikerP2Ref.current.body, aiMove.angle, aiMove.power);
          setIsAnimating(true);
          setCanShoot(false);

          // AI turn will be reset when turn changes or pieces stop
        }, 500);

        return () => clearTimeout(shootTimeout);
      }, 1000);

      return () => {
        clearTimeout(thinkingTimeout);
      };
    }
  }, [isAITurn, canShoot, isAnimating, gameConfig]);

  // Mouse/Touch handlers for striker control
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canShoot || isAnimating || isAITurn || !currentStrikerRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const striker = currentStrikerRef.current.body.position;

    // Check if clicking in striker line area (changes based on player)
    const isInStrikerArea = (isPlayer1Turn && clickY >= STRIKER_AREA_MIN_Y) ||
                           (!isPlayer1Turn && clickY <= STRIKER_AREA_MAX_Y);

    if (isInStrikerArea) {
      // Position striker on striker line at click X position
      const clampedX = Math.max(50, Math.min(BOARD_SIZE - 50, clickX));
      Matter.Body.setPosition(currentStrikerRef.current.body, { x: clampedX, y: strikerLineY });
      // Reset velocity to prevent drift
      Matter.Body.setVelocity(currentStrikerRef.current.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(currentStrikerRef.current.body, 0);
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
  }, [canShoot, isAnimating, isAITurn, isPlayer1Turn, strikerLineY, STRIKER_AREA_MIN_Y, STRIKER_AREA_MAX_Y, currentStrikerRef]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !currentStrikerRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const striker = currentStrikerRef.current.body.position;

    // Calculate aim angle
    const dx = mouseX - striker.x;
    const dy = mouseY - striker.y;
    const angle = Math.atan2(dy, dx);
    setAimAngle(angle);

    // Calculate power
    const distance = Math.sqrt(dx * dx + dy * dy);
    const newPower = Math.min(Math.max(distance / 2, 20), 100);
    setPower(newPower);
  }, [isDragging, currentStrikerRef]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging || !canShoot || !currentStrikerRef.current) return;

    setIsDragging(false);

    if (power > 10) {
      // Mark that a shot was taken this turn
      shotTakenThisTurnRef.current = true;
      piecePocketedThisTurnRef.current = false;
      applyStrikerForce(currentStrikerRef.current.body, aimAngle, power);
      setIsAnimating(true);
      setCanShoot(false);
      setPower(0);
    }
  }, [isDragging, canShoot, power, aimAngle, currentStrikerRef]);

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
