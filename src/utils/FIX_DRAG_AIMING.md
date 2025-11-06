# Bug Fix: Drag Aiming Issue

## Problem
Users couldn't aim at the queen (center piece) or other pieces in certain directions due to restricted drag behavior.

## Root Cause
The original implementation had two issues:

1. **Pointer Down**: Only allowed horizontal striker positioning on the baseline
2. **Aiming Logic**: Calculated aim from the striker's current position, but the drag start position wasn't properly tracked
3. **Limited Angle Range**: Users could only drag in certain directions after positioning the striker

## Solution

### Changes Made in `src/components/GameBoard.tsx`

#### 1. Added Drag Start Tracking (Line ~41)
```typescript
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
```

#### 2. Improved Pointer Down Handler (Line ~256-280)
**New Behavior:**
- If clicking/touching **near the striker** (within 50px): Start aiming from current striker position
- If clicking/touching **elsewhere on board**: Move striker to that X position on baseline, then start aiming

```typescript
const handlePointerDown = useCallback((e: React.PointerEvent) => {
  if (!canShoot || isAnimating || isAITurn || !strikerRef.current) return;
  
  // Calculate distance from click to striker
  const distance = Math.sqrt(
    Math.pow(x - striker.x, 2) + Math.pow(y - striker.y, 2)
  );
  
  if (distance < 50) {
    // Click on striker: start aiming from current position
    setDragStart({ x: striker.x, y: striker.y });
  } else {
    // Click elsewhere: move striker, then start aiming
    const clampedX = Math.max(80, Math.min(x, BOARD_SIZE - 80));
    Matter.Body.setPosition(strikerRef.current.body, { x: clampedX, y: STRIKER_LINE_Y });
    setDragStart({ x: clampedX, y: STRIKER_LINE_Y });
  }
}, [canShoot, isAnimating, isAITurn]);
```

#### 3. Fixed Pointer Move Handler (Line ~282-297)
**New Behavior:**
- Calculates angle and power from `dragStart` position instead of constantly querying striker position
- Allows aiming in any direction (360 degrees)

```typescript
const handlePointerMove = useCallback((e: React.PointerEvent) => {
  if (!isDragging || !dragStart) return;
  
  // Calculate from drag start point
  const dx = mouseX - dragStart.x;
  const dy = mouseY - dragStart.y;
  const angle = Math.atan2(dy, dx);
  
  const distance = Math.sqrt(dx * dx + dy * dy);
  const newPower = Math.min(Math.max(distance / 2, 20), 100);
}, [isDragging, dragStart]);
```

#### 4. Enhanced Pointer Up Handler (Line ~299-316)
**New Behavior:**
- Properly resets `dragStart` state
- Clears power indicator even if shot is too weak (power < 10)

#### 5. Improved Visual Feedback (Line ~149-185)
**New Features:**
- Aim line only shows when actively dragging or power > 0
- Extended dotted guide line shows full trajectory when power > 10
- Power circle grows with shot strength

## Testing

### Before Fix
- ❌ Couldn't aim upward toward queen
- ❌ Limited angle range
- ❌ Confusing interaction model
- ❌ Had to position striker first, then aim

### After Fix
- ✅ Can aim in any direction (360°)
- ✅ Click near striker to aim from current position
- ✅ Click elsewhere to reposition striker
- ✅ Extended guide line shows shot trajectory
- ✅ Smooth, intuitive drag-to-aim experience

## Usage

1. **Quick Aim**: Tap/click near your striker and drag in any direction
2. **Reposition + Aim**: Tap/click elsewhere on the board to move striker horizontally, then drag to aim
3. **Shot Power**: Drag length determines power (20-100)
4. **Visual Feedback**: 
   - Yellow solid line: Power indicator
   - Yellow circle: Power radius
   - Yellow dotted line: Extended trajectory guide

## Files Modified
- `src/components/GameBoard.tsx` (Lines: 41, 256-316, 149-185)

## Impact
- **User Experience**: Significantly improved aiming control
- **Game Playability**: All pieces now reachable
- **Visual Clarity**: Better feedback during aim
- **Backward Compatibility**: Maintained existing game mechanics
