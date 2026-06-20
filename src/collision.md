# Collision

This page describes the collision system in TeeFrame, which is a direct port of Teeworlds 0.6 `CCollision`. The collision system converts the Game layer tile data into collision flags and provides methods for movement and intersection tests.

## Collision Flags

Each tile in the collision grid has a flag value:

| Value | Name | Description |
| ----- | :--- | :---------- |
| 0 | None | Empty space, no collision. |
| 1 | COLFLAG_SOLID | Solid wall. |
| 2 | COLFLAG_DEATH | Death tile (kills on contact). |
| 4 | COLFLAG_NOHOOK | Unhookable solid (hook bounces off). |

:::info
`COLFLAG_NOHOOK` tiles have both `COLFLAG_SOLID` and `COLFLAG_NOHOOK` set (value = 5).
:::

## Initialization

The collision system is initialized from the Game layer of a map. The process converts tile indices to collision flags:

```c
for each tile in the game layer:
    if tile.index > 128:
        // Entity tiles and decorative tiles — no collision
        collision[i] = 0
    else:
        switch tile.index:
            case TILE_DEATH (2):  → COLFLAG_DEATH
            case TILE_SOLID (1):  → COLFLAG_SOLID
            case TILE_NOHOOK (3): → COLFLAG_SOLID | COLFLAG_NOHOOK
            default:              → 0
```

Tiles with indices above 128 are decorative or entity tiles and are treated as empty space for collision purposes. The entity positions are extracted separately from the Game layer for spawn points and pickups.

## Grid Coordinates

The collision grid uses **tile coordinates**, where each tile is 32×32 pixels. To convert from pixel coordinates to tile coordinates:

```c
tile_x = clamp(x / 32, 0, width - 1)
tile_y = clamp(y / 32, 0, height - 1)
```

The collision grid dimensions match the Game layer dimensions.

## Methods

### checkPoint(x, y)

Checks if a pixel position is on a solid tile.

```c
bool checkPoint(float x, float y)
    return isTileSolid(round(x), round(y))
```

### getCollisionAt(x, y)

Returns the collision flag at a pixel position.

```c
int getCollisionAt(float x, float y)
    return getTile(round(x), round(y))
```

### getWidth() / getHeight()

Returns the dimensions of the collision grid in tiles.

### intersectLine(pos0, pos1)

Traces a line between two points and returns the first collision. Used for weapons like the laser rifle and for the hook.

```c
[int, Vector2, Vector2] intersectLine(Vector2 pos0, Vector2 pos1)
    distance = distance(pos0, pos1)
    for i = 0 to distance step 1:
        pos = mix(pos0, pos1, i / distance)
        if checkPoint(pos):
            return [getCollisionAt(pos), pos, lastPos]
        lastPos = pos
    return [0, pos1, pos1]
```

Returns a tuple: `[collisionFlag, hitPosition, positionBeforeHit]`.

### testBox(pos, size)

Tests if an axis-aligned box at `pos` with `size` overlaps any solid tile. The box extends `size / 2` in each direction from `pos`.

```c
bool testBox(Vector2 pos, Vector2 size)
    halfW = size.x * 0.5
    halfH = size.y * 0.5
    return checkPoint(pos.x - halfW, pos.y - halfH)
        || checkPoint(pos.x + halfW, pos.y - halfH)
        || checkPoint(pos.x - halfW, pos.y + halfH)
        || checkPoint(pos.x + halfW, pos.y + halfH)
```

### movePoint(pos, vel, elasticity, &bounces)

Moves a point by `vel`, resolving collisions with an elasticity factor. The point bounces off solid tiles.

```c
void movePoint(Vector2 pos, Vector2 vel, float elasticity, int &bounces)
    bounces = 0
    if checkPoint(pos + vel):
        if checkPoint(pos.x + vel.x, pos.y):
            vel.x *= -elasticity; bounces++
        if checkPoint(pos.x, pos.y + vel.y):
            vel.y *= -elasticity; bounces++
        if no axis collision (corner case):
            vel.x *= -elasticity
            vel.y *= -elasticity
    else:
        pos += vel
```

### moveBox(pos, vel, size, elasticity)

Moves an axis-aligned box by `vel`, resolving collisions against solid tiles. Used for character movement (28×28 hitbox).

```c
void moveBox(Vector2 pos, Vector2 vel, Vector2 size, float elasticity)
    distance = length(vel)
    max = (int)distance
    if distance <= 0.00001: return

    fraction = 1.0 / (max + 1)
    for i = 0 to max:
        newPos = pos + vel * fraction

        if testBox(newPos, size):
            // Try each axis separately
            if testBox(Vector2(pos.x, newPos.y), size):
                newPos.y = pos.y; vel.y *= -elasticity
            if testBox(Vector2(newPos.x, pos.y), size):
                newPos.x = pos.x; vel.x *= -elasticity
            // Corner case: no single axis resolved
            if no axis hit:
                newPos.y = pos.y; vel.y *= -elasticity
                newPos.x = pos.x; vel.x *= -elasticity

        pos = newPos
```

## How It Works

The collision system is initialized when a map is loaded, and is used by the game server for player physics:

1. **Ground detection**: Checks two points at the character's feet (left and right edges) to determine if the character is grounded.
2. **Movement**: `moveBox` is called every tick with the character's velocity and 28×28 hitbox.
3. **Hook**: `intersectLine` traces the hook's path to find where it attaches to walls.
4. **Weapons**: `intersectLine` traces projectile and laser paths.