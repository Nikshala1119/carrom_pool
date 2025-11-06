# Quick Reference - Drag Aiming Fix

## 🎯 What Was Fixed
Drag aiming now supports 360° angles, allowing shots at the center queen and all pieces.

## 📋 Changed File
`src/components/GameBoard.tsx`

## 🔧 Key Code Changes

### Added State
```typescript
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
```

### Modified Functions

#### handlePointerDown (~Line 256)
```typescript
// NEW: Smart detection - within 50px starts aim, else repositions
const distance = Math.sqrt(
  Math.pow(x - striker.x, 2) + Math.pow(y - striker.y, 2)
);
if (distance < 50) {
  setDragStart({ x: striker.x, y: striker.y });
} else {
  const clampedX = Math.max(80, Math.min(x, BOARD_SIZE - 80));
  Matter.Body.setPosition(strikerRef.current.body, { x: clampedX, y: STRIKER_LINE_Y });
  setDragStart({ x: clampedX, y: STRIKER_LINE_Y });
}
```

#### handlePointerMove (~Line 282)
```typescript
// NEW: Calculate from dragStart instead of current striker position
const dx = mouseX - dragStart.x;
const dy = mouseY - dragStart.y;
const angle = Math.atan2(dy, dx);
```

#### handlePointerUp (~Line 299)
```typescript
// NEW: Always reset dragStart
setDragStart(null);
```

#### Render Loop (~Line 149)
```typescript
// NEW: Extended dotted guide line
if (power > 10) {
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  const extendedX = striker.x + Math.cos(aimAngle) * 300;
  const extendedY = striker.y + Math.sin(aimAngle) * 300;
  ctx.lineTo(extendedX, extendedY);
  ctx.setLineDash([5, 5]);
  ctx.stroke();
}
```

## 🎮 User Controls

| Action | Behavior |
|--------|----------|
| Click/tap near striker | Start aiming from current position |
| Click/tap elsewhere | Move striker to X position, start aiming |
| Drag | Set angle (any direction) and power |
| Release | Shoot (if power > 10) |

## 📊 Visual Feedback

| Element | Appearance | Meaning |
|---------|------------|---------|
| Solid yellow line | From striker outward | Power indicator |
| Yellow circle | Around striker | Power radius |
| Dotted yellow line | Extended from solid line | Shot trajectory |

## ⚙️ Constants

```typescript
CLICK_NEAR_RADIUS = 50px       // Detection radius for "near striker"
MIN_STRIKER_X = 80             // Left boundary
MAX_STRIKER_X = BOARD_SIZE-80  // Right boundary
MIN_POWER = 20                 // Minimum shot power
MAX_POWER = 100                // Maximum shot power
MIN_SHOOT_POWER = 10           // Minimum to execute shot
```

## 🧪 Test Cases

```typescript
// Test 1: Aim at queen
striker.position = { x: 300, y: 500 }
queen.position = { x: 300, y: 300 }
// Should: Allow direct vertical aim (angle = -π/2)

// Test 2: Reposition striker
clickPosition = { x: 200, y: 250 }
// Should: Move striker to (200, 500) then enable aim

// Test 3: Click near striker
clickPosition = { x: 310, y: 510 }  // 14px from striker at (300,500)
// Should: Start aiming immediately, no repositioning

// Test 4: Power calculation
dragDistance = 100px
// Should: power = 50

// Test 5: Extended guide
power = 60
// Should: Show dotted line extending 300px from striker
```

## 🐛 Debug Helpers

```typescript
// Add to render loop for debug visualization:
ctx.fillStyle = 'red';
ctx.fillText(`Angle: ${(aimAngle * 180 / Math.PI).toFixed(1)}°`, 10, 20);
ctx.fillText(`Power: ${power.toFixed(0)}`, 10, 40);
if (dragStart) {
  ctx.fillText(`Start: (${dragStart.x.toFixed(0)}, ${dragStart.y.toFixed(0)})`, 10, 60);
}
```

## 📝 Dependencies
- Matter.js (physics engine) - no changes
- React hooks (useState, useCallback, useRef) - standard usage
- Canvas 2D context - standard drawing API

## ⚡ Performance
- Added: 1 state variable
- Added: 1 distance calculation per click
- Added: 1 conditional dotted line render
- Impact: Negligible (< 1ms per frame)

## 🔄 Rollback
If needed, revert to original by:
1. Remove `dragStart` state
2. Restore original `handlePointerDown` (simple X positioning)
3. Restore original `handlePointerMove` (use striker.position)
4. Remove extended dotted line from render

## 📚 Documentation
- Full fix details: `FIX_DRAG_AIMING.md`
- Visual guide: `DRAG_MECHANICS_GUIDE.md`
- Feature list: `FEATURES.md`
- Summary: `README_FIX.md`
