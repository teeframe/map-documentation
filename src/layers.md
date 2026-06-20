# Layers

This page describes the layer types found in Teeworlds 0.6 maps. Layers define the visual and physical structure of the game world.

## Layer Item (type_id = 5)

Every layer item starts with a common header. The remaining fields depend on the layer type.

### Common Header

| Field | Type | Description |
| ----- | :--: | :---------- |
| _version | int | Unused (was uninitialized in the editor). |
| type | int | Layer type: `2` = Tilemap, `3` = Quads. |
| flags | int | Layer flags (see below). |

### Layer Flags

| Value | Name | Description |
| ----- | :--- | :---------- |
| 1 | LAYERFLAG_DETAIL | Layer should only be rendered on high detail settings. |

## Tilemap Layer

Tilemap layers contain a grid of tiles. They are the most common layer type and include both visual tiles and the physics-defining Game layer.

```sh
// ...common header...
byte[*-...]  // version       - tilemap version (up to 4)
byte[*-...]  // width         - layer width in tiles
byte[*-...]  // height        - layer height in tiles
byte[*-...]  // flags         - tilemap flags (see below)
byte[*-...]  // color_r       - color tint (red, 0-255)
byte[*-...]  // color_g       - color tint (green, 0-255)
byte[*-...]  // color_b       - color tint (blue, 0-255)
byte[*-...]  // color_a       - color tint (alpha, 0-255)
byte[*-...]  // color_env     - color envelope index (-1 if unused)
byte[*-...]  // color_env_offset - color envelope time offset
byte[*-...]  // image         - image index (-1 if unused)
byte[*-...]  // data          - index to the tile data block
byte[*-...]  // name          - (version 3+) I32String name (3 ints)
```

### Tilemap Flags

| Value | Name | Description |
| ----- | :--- | :---------- |
| 0 | TILESLAYERFLAG_NONE | Regular visual tiles layer. |
| 1 | TILESLAYERFLAG_GAME | Game layer (defines physics and entities). |

### Tile Structure

Each tile is **4 bytes** in the data block:

| Byte | Name | Description |
| :--: | :--- | :---------- |
| 0 | index | Tile index (0 = air, 1 = solid, 2 = death, 3 = unhookable, 192+ = entities). |
| 1 | flags | Tile flags (see below). |
| 2 | skip | Skip count for version 4 compression (set to 0 after expansion). |
| 3 | reserved | Unused. |

### Tile Flags

| Value | Name | Description |
| ----- | :--- | :---------- |
| 1 | TILEFLAG_VFLIP | Vertical flip. |
| 2 | TILEFLAG_HFLIP | Horizontal flip. |
| 4 | TILEFLAG_OPAQUE | Opaque (for rendering). |
| 8 | TILEFLAG_ROTATE | 90° rotation.

The order of operations is: horizontal flip → vertical flip → rotation.

### Skip Compression (Version 4)

In version 4 tilemaps, the `skip` byte is used for compression. Instead of storing a full 2D grid, tiles with the same value are stored once with a skip count indicating how many identical tiles follow.

Example: a tile with `skip = 3` means "this tile repeats 3 more times" (4 total identical tiles). After expanding, set `skip = 0` on all tiles.

## Game Layer

The Game layer is a tilemap layer with `TILESLAYERFLAG_GAME` set. It defines the physics of the world and the positions of entities.

### Physics Tiles

| Index | Name | Description |
| ----- | :--- | :---------- |
| 0 | TILE_AIR | Empty space. |
| 1 | TILE_SOLID | Solid wall (players collide). |
| 2 | TILE_DEATH | Death tile (kills on contact). |
| 3 | TILE_NOHOOK | Solid but unhookable (hook bounces off). |

### Entity Tiles

Entity tiles use indices from 192 to 202. Each entity spawns at the center of its tile (pixel position = `tile_x * 32 + 16`, `tile_y * 32 + 16`).

| Index | Name | Description |
| ----- | :--- | :---------- |
| 192 | ENTITY_SPAWN | DM/TDM spawn point. |
| 193 | ENTITY_SPAWN_RED | Red team spawn point. |
| 194 | ENTITY_SPAWN_BLUE | Blue team spawn point. |
| 195 | ENTITY_FLAGSTAND_RED | Red flag stand (CTF). |
| 196 | ENTITY_FLAGSTAND_BLUE | Blue flag stand (CTF). |
| 197 | ENTITY_ARMOR_1 | Armor pickup. |
| 198 | ENTITY_HEALTH_1 | Health pickup. |
| 199 | ENTITY_WEAPON_SHOTGUN | Shotgun pickup. |
| 200 | ENTITY_WEAPON_GRENADE | Grenade pickup. |
| 201 | ENTITY_POWERUP_NINJA | Ninja powerup. |
| 202 | ENTITY_WEAPON_RIFLE | Laser rifle pickup. |

## Quads Layer

Quads layers contain textured rectangles. They are used for visual elements like backgrounds and decorations.

```sh
// ...common header...
byte[*-...]  // version   - quads version (up to 2)
byte[*-...]  // num_quads - number of quads
byte[*-...]  // data      - index to the quads data block
byte[*-...]  // image     - image index
byte[*-...]  // name      - (version 2+) I32String name (3 ints)
```

### Quad Structure

Each quad is **152 bytes** (38 ints) in the data block:

| Field | Ints | Type | Description |
| ----- | :--: | :--: | :---------- |
| positions | 10 | Point[5] | 5 corner positions (22.10 fixed-point). |
| corner_colors | 16 | Color[4] | 4 corner colors (r, g, b, a). |
| texture_coords | 8 | Point[4] | 4 texture coordinates (0-1024 range). |
| pos_env | 1 | int | Position envelope index (-1 if unused). |
| pos_env_offset | 1 | int | Position envelope time offset. |
| color_env | 1 | int | Color envelope index (-1 if unused). |
| color_env_offset | 1 | int | Color envelope time offset. |

:::info
Corner order: top-left → top-right → bottom-left → bottom-right. The 5th point in `positions` is the pivot. Divide positions by 512 to get world coordinates. Divide texture coordinates by 1024 to normalize to (0, 1) range.
:::