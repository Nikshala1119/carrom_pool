# Visual Guide: New Drag Mechanics

## Interaction Modes

### Mode 1: Quick Aim (Click Near Striker)
```
     Board
┌─────────────────┐
│                 │
│       👑        │ ← Queen in center
│      (target)   │
│                 │
│                 │
│      [●]────→   │ ← Click near striker (within 50px)
│   striker  drag │   Drag in ANY direction
│                 │   Aim angle: 360° freedom
└─────────────────┘
     Baseline
```

### Mode 2: Reposition + Aim (Click Elsewhere)
```
     Board
┌─────────────────┐
│                 │
│       👑        │
│                 │
│         ↓       │
│    ×    ↓       │ ← Click anywhere else
│         ↓       │   Striker moves to X pos
│      [●]────→   │   Then drag to aim
│                 │
└─────────────────┘
     Baseline
```

## Aiming Examples

### Example 1: Shooting at Center Queen
```
Before (BROKEN):
┌─────────────────┐
│       👑        │ ← Can't aim here!
│        ✗        │
│                 │
│      [●]        │ ← Limited angle
│       └─→       │
└─────────────────┘

After (FIXED):
┌─────────────────┐
│       👑        │ ← Can aim here!
│        ↑        │
│        │        │
│      [●]        │ ← Full 360° range
│                 │
└─────────────────┘
```

### Example 2: Angled Shots
```
Drag Pattern:
       target
         ●
        ↗
       ↗
      ↗
    [●] ← striker
    
Result:
- Angle: calculated from drag direction
- Power: calculated from drag distance
- Guide line: shows exact trajectory
```

## Visual Feedback System

### Power Indicator (Dynamic)
```
Low Power (20-40):
  [●]─→
  ( )  ← Small circle

Medium Power (40-70):
  [●]──→
  (  ) ← Medium circle

High Power (70-100):
  [●]────→
  (   ) ← Large circle
  ··········→ ← Extended dotted guide
```

### Aim Line Components
```
┌──────────────────────┐
│                      │
│  target              │
│    ●                 │
│     ↖                │
│      ↖               │
│       ↖              │
│    [●]───────        │ ← Striker
│     └─solid line     │   (power indicator)
│       └─circle       │   (power radius)
│         └─dotted···→ │   (extended guide)
│                      │
└──────────────────────┘
```

## Control Flow

1. **Touch/Click Detection**
   ```
   User clicks at position (x, y)
        ↓
   Calculate distance to striker
        ↓
   Distance < 50px? ──YES──→ Start aiming from current position
        │
        NO
        ↓
   Move striker to X position on baseline
        ↓
   Start aiming from new position
   ```

2. **Drag Calculation**
   ```
   User drags to position (x2, y2)
        ↓
   dx = x2 - dragStart.x
   dy = y2 - dragStart.y
        ↓
   angle = atan2(dy, dx)
   distance = sqrt(dx² + dy²)
        ↓
   power = clamp(distance/2, 20, 100)
   ```

3. **Shot Execution**
   ```
   User releases
        ↓
   Power > 10? ──NO──→ Reset (no shot)
        │
       YES
        ↓
   Apply force vector to striker
        ↓
   Start physics simulation
   ```

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Aim Range | Limited (~90°) | Full (360°) |
| Queen Accessible | ❌ No | ✅ Yes |
| Reposition | Separate action | Integrated |
| Visual Guide | Basic line | Line + circle + extended dotted |
| UX Flow | 2-step (position → aim) | Smart 1-step |

## Distance Calculations

### Click Detection
```javascript
// Within 50px = "near striker"
distance = sqrt((clickX - strikerX)² + (clickY - strikerY)²)
isNearStriker = distance < 50
```

### Power Calculation
```javascript
// Drag distance → power
dragDistance = sqrt((dragX - startX)² + (dragY - startY)²)
power = clamp(dragDistance / 2, 20, 100)
// Min: 20 (weak shot)
// Max: 100 (strong shot)
```

### Angle Calculation
```javascript
// Direction from drag start to current position
angle = atan2(currentY - startY, currentX - startX)
// Result: -π to +π radians (full 360°)
```
