# Carrom Pool - Feature Documentation

## Core Architecture

### Application Entry
- **Main App** - `src/App.tsx`
  - `AppContent` - Routes between Menu/Game/Leaderboard views
  - `handleStartGame(mode, playerName)` - Initializes game
  - `handleQuitGame()` - Resets game state
  - `handleShowLeaderboard()` - Shows leaderboard view

### Type Definitions - `src/types/game.ts`
- **Enums**: `PieceType`, `PieceColor`, `GameMode`, `GameState`, `PlayerTurn`
- **Interfaces**: `Piece`, `Player`, `GameConfig`, `StrikerControl`, `LeaderboardEntry`, `MultiplayerGame`, `User`

## State Management

### AuthContext - `src/context/AuthContext.tsx`
- `signIn(email, password)` - Email/password authentication
- `signUp(email, password, displayName)` - User registration
- `signInAsGuest()` - Anonymous sign-in with random display name
- `signOut()` - Firebase sign out
- `user` - Current authenticated user state
- `onAuthStateChanged` listener - Syncs auth state

### GameContext - `src/context/GameContext.tsx`
- `startGame(mode, playerName)` - Creates game config with 2 players
- `endGame()` - Sets game state to GAME_OVER
- `switchTurn()` - Toggles between PLAYER1/PLAYER2
- `updateScore(player, points)` - Updates player score and pieces collected
- `setPaused(paused)` - Toggles PAUSED/PLAYING state
- `resetGame()` - Clears game config
- `gameConfig` - Current game configuration state

## UI Components

### Menu - `src/components/Menu.tsx`
- Guest sign-in prompt if no user
- Game mode selection (Single/Multiplayer)
- Player name input form
- Leaderboard button
- Sign out button
- `handleModeSelect(mode)` - Shows name input
- `handleStartGame()` - Triggers game start with selected mode

### Game - `src/components/Game.tsx`
- `handleScoreUpdate(player, points, pieceType)` - Updates score, checks queen capture
- `handleTurnEnd()` - Switches active player
- `handleGameOver()` - Determines winner, updates leaderboard
- `handlePlayAgain()` - Resets to menu
- Pause overlay with Resume/Quit buttons
- Game over modal with final scores and winner
- Game end condition: totalScore > 200 OR piecesCollected >= 18

### GameBoard - `src/components/GameBoard.tsx`
- **Physics Engine Init** (useEffect) - Creates Matter.js engine, pieces, striker, walls
- **Custom Render Loop** - Draws board, pieces, pockets, striker, aim line, power indicator, extended trajectory guide
- **Pocketing Check** (useEffect interval) - Checks piece/striker collision with pockets, awards points
- **AI Turn Handler** (useEffect) - Executes AI move when isAITurn
- `handlePointerDown(e)` - Smart positioning: clicks near striker (50px) start aiming from current position; clicks elsewhere move striker to X position on baseline
- `handlePointerMove(e)` - Calculates aim angle and power from drag start position (enables 360° aiming)
- `handlePointerUp()` - Shoots striker if power > 10, resets drag state
- Stationary detection - Waits for all pieces to stop before ending turn
- `dragStart` state - Tracks initial drag position for accurate aim calculation

### ScoreBoard - `src/components/ScoreBoard.tsx`
- Displays player1/player2 names, scores, pieces collected
- Active turn indicator
- Queen possession badge
- Color-coded piece indicators

### Leaderboard - `src/components/Leaderboard.tsx`
- `loadLeaderboard()` - Fetches top 10 entries
- `getMedalEmoji(rank)` - Shows 🥇🥈🥉 for top 3
- Displays username, score, wins/losses per entry
- Loading state and empty state handling

## Physics Engine - `src/utils/physics.ts`

### Constants
- `BOARD_SIZE=600`, `PIECE_RADIUS=15`, `STRIKER_RADIUS=18`, `POCKET_RADIUS=25`
- `FRICTION=0.08`, `RESTITUTION=0.85`, `STRIKER_LINE_Y=500`
- `POCKET_POSITIONS` - 4 corner pockets at (50,50), (550,50), (50,550), (550,550)

### Functions
- `createEngine()` - Matter.js engine with zero gravity
- `createPiece(x, y, type, id)` - Creates Matter.js circle body with type-specific color/properties
- `setupBoard()` - Arranges 19 pieces: 1 queen (center), 6-piece ring1, 12-piece ring2 (alternating colors)
- `createBoardBoundaries()` - 4 static rectangle walls (top/bottom/left/right)
- `applyStrikerForce(striker, angle, power)` - Applies force vector to striker body
- `checkPocketed(piece)` - Returns true if piece within POCKET_RADIUS of any pocket
- `isStrikerInValidPosition(x, y)` - Validates striker on baseline within bounds
- `resetStrikerPosition(striker)` - Resets striker to center baseline with zero velocity
- `arePiecesStationary(pieces)` - Returns true if all pieces have velocity < 0.1

## AI System - `src/utils/ai.ts`

### Enums & Types
- `AIDifficulty`: `EASY`, `MEDIUM`, `HARD`
- `AIMove`: `{ strikerX, angle, power }`

### Functions
- `calculateAIMove(pieces, targetColor, difficulty)` - Returns optimal AI move
- `selectBestTarget(pieces, difficulty)` - Picks piece based on difficulty:
  - EASY: Random selection
  - MEDIUM: Closest to striker + 0.5× pocket distance
  - HARD: 0.7× striker distance + 0.3× pocket distance, prefers queen
- `calculateStrikerPosition(targetX, targetY, strikerY, difficulty)` - Calculates striker position to aim target toward nearest pocket
- `calculatePower(distance, difficulty)` - Base power 50 + distance/10, scaled by difficulty (0.8×/1.0×/1.1×)
- `getDifficultyVariations(difficulty)` - Returns angle/power variation ranges:
  - EASY: ±0.3 angle, ±30 power
  - MEDIUM: ±0.15 angle, ±15 power
  - HARD: ±0.05 angle, ±5 power
- `getRandomMove()` - Fallback random shot
- `getNearestPocket(x, y)` - Returns closest pocket to coordinates
- `getDistanceToNearestPocket(x, y)` - Distance calculation

## Firebase Services - `src/services/firebase.ts`

### Leaderboard
- `updateLeaderboard(userId, username, score, won)` - Creates/updates leaderboard doc, increments wins/losses
- `getLeaderboard(limitCount)` - Queries top N entries ordered by score descending

### Multiplayer (Infrastructure only - not fully implemented in UI)
- `createMultiplayerGame(player1Id, player1Name)` - Creates game doc with 'waiting' status
- `joinMultiplayerGame(gameId, player2Id, player2Name)` - Updates game to 'active' status
- `findAvailableGame()` - Queries for games with status='waiting'
- `updateGameState(gameId, gameState, currentTurn)` - Syncs game state
- `subscribeToGame(gameId, callback)` - Real-time listener for game updates
- `endMultiplayerGame(gameId, winnerId)` - Sets status='completed'

### Firebase Config - `src/config/firebase.ts`
- Initializes Firebase app, Auth, Firestore, Analytics
- Exports `auth`, `db`, `analytics` instances
- Reads config from env vars with fallback defaults

## Game Mechanics

### Scoring Rules (in `Game.tsx:handleScoreUpdate`)
- WHITE piece: +10 points
- BLACK piece: +20 points
- QUEEN: +50 points, sets `hasQueen=true` for player
- STRIKER pocketed: -10 points, striker respawns at center

### Turn System
- Starts with PLAYER1
- Turn ends when all pieces stationary AND no piece pocketed
- If piece pocketed: player gets another turn
- AI executes automatically when `isAITurn=true`

### Game Over Conditions (in `Game.tsx:handleScoreUpdate`)
- Total score > 200
- OR combined pieces collected >= 18

### Controls
- **Quick Aim**: Click/tap near striker (50px radius) to start aiming from current position
- **Reposition + Aim**: Click/tap elsewhere to move striker horizontally on baseline to that X position
- Drag from striker to set angle (360° range) and power
- Release to shoot (minimum power: 10)
- Visual indicators: 
  - Solid yellow line: Power indicator (length = power × 2, max 200)
  - Yellow circle: Power radius (25 + power/5)
  - Dotted yellow line: Extended trajectory guide (appears when power > 10)

## Data Flow

1. **User Auth**: `AuthContext` → Firebase Auth → `user` state
2. **Game Start**: Menu → `GameContext.startGame()` → Creates `gameConfig` → Renders `Game` → Renders `GameBoard`
3. **Physics Loop**: `GameBoard` useEffect → Matter.js runner → Custom render loop → Canvas drawing
4. **Shot Execution**: Pointer drag → Calculate angle/power → `applyStrikerForce()` → Physics simulation
5. **Pocketing**: Interval check → `checkPocketed()` → Remove body → `Game.handleScoreUpdate()` → `GameContext.updateScore()`
6. **Turn End**: `arePiecesStationary()` → `Game.handleTurnEnd()` → `GameContext.switchTurn()`
7. **AI Turn**: `isAITurn=true` → `calculateAIMove()` → Position striker → Shoot → Turn cycle
8. **Game Over**: Condition met → `handleGameOver()` → `updateLeaderboard()` → Show modal

## Missing/Incomplete Features

- **Multiplayer UI**: Firebase functions exist but no UI implementation for matchmaking/game sync
- **Foul Rules**: No complex carrom fouls (e.g., covering queen requirement)
- **Piece Assignment**: Players hardcoded to WHITE/BLACK, no dynamic assignment
- **Time Limits**: No turn timer
- **Sound Effects**: No audio system
- **Offline Mode**: Requires authentication even for single-player

## Recent Bug Fixes

- **✅ Drag Aiming (Fixed)**: Can now aim in any direction (360°) including at the queen. Smart positioning system allows clicking near striker to aim or elsewhere to reposition.
