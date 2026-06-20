# Map Items

This page describes all map item types found in Teeworlds 0.6 maps. Each item type has a unique `type_id` and defines a specific aspect of the map: version info, author metadata, images, envelopes, groups, and layers.

All item data fields are 32-bit integers. String fields are stored as data block indices pointing to null-terminated C strings, except for `I32String` fields which use a special encoding.

## Version Item (type_id = 0)

There is exactly one version item per map. It contains only the version number.

| Field | Type | Description |
| ----- | :--: | :---------- |
| version | int | Always `1` in vanilla and DDNet maps. |

## Info Item (type_id = 1)

There is exactly one info item per map. It contains metadata about the map and its author.

| Field | Type | Description |
| ----- | :--: | :---------- |
| version | int | Info item version. Always `1`. |
| author | data index | Index to a data block containing the author name (max 32 bytes). |
| map_version | data index | Index to a data block containing the map version string (max 16 bytes). |
| credits | data index | Index to a data block containing the credits string (max 128 bytes). |
| license | data index | Index to a data block containing the license string (max 32 bytes). |

:::info
All string data indices are optional and can be `-1` if the field is not present.
:::

## Image Item (type_id = 2)

Images can be either **embedded** (stored inside the map file) or **external** (loaded from the client's `mapres` directory).

| Field | Type | Description |
| ----- | :--: | :---------- |
| version | int | Image item version (`1` or `2`). |
| width | int | Image width in pixels. |
| height | int | Image height in pixels. |
| external | int | `1` if external, `0` if embedded. |
| image_name | data index | Index to a data block containing the image filename. |
| image_data | data index | Index to a data block containing the image pixel data. |
| format | int | *(Version 2 only)* Image format: `0` = RGB, `1` = RGBA. |

### External Images

External images must be present in the client's `mapres` folder under the `image_name`. The following images are considered external by the Teeworlds 0.6 client:

`bg_cloud1`, `bg_cloud2`, `desert_doodads`, `desert_main`, `desert_mountains2`, `desert_mountains`, `desert_sun`, `generic_deathtiles`, `generic_unhookable`, `grass_doodads`, `grass_main`, `jungle_background`, `jungle_deathtiles`, `jungle_doodads`, `jungle_main`, `jungle_midground`, `jungle_unhookables`, `moon`, `mountains`, `snow`, `stars`, `sun`, `winter_doodads`, `winter_main`, `winter_mountains2`, `winter_mountains3`, `winter_mountains`

## Group Item (type_id = 4)

Groups organize layers. Each group contains a contiguous range of layers and defines parallax and clipping settings.

| Field | Type | Description |
| ----- | :--: | :---------- |
| version | int | Group item version (`1`, `2`, or `3`). |
| offset_x | int | Horizontal offset in pixels. |
| offset_y | int | Vertical offset in pixels. |
| parallax_x | int | Horizontal parallax (100 = normal). |
| parallax_y | int | Vertical parallax (100 = normal). |
| start_layer | int | Index of the first layer in this group. |
| num_layers | int | Number of layers in this group. |
| use_clipping | int | *(Version 2+)* `1` if clipping is enabled. |
| clip_x | int | *(Version 2+)* Clipping region X. |
| clip_y | int | *(Version 2+)* Clipping region Y. |
| clip_w | int | *(Version 2+)* Clipping region width. |
| clip_h | int | *(Version 2+)* Clipping region height. |
| name | I32String | *(Version 3+)* Group name (3 ints). |

### The Game Group

Every map must have a **Game group**. This group should have `offset_x = 0`, `offset_y = 0`, `parallax_x = 100`, `parallax_y = 100`, and a name of `"Game"`. The Game group is the only group that can contain physics layers (the Game layer).

## Envelope Item (type_id = 3)

Envelopes define animations for positions, colors, and sounds over time.

| Field | Type | Description |
| ----- | :--: | :---------- |
| version | int | Envelope version (`1` or `2`). |
| channels | int | Envelope type: `1` = Sound, `3` = Position, `4` = Color. |
| start_point | int | Index of the first envelope point for this envelope. |
| num_points | int | Number of envelope points. |
| name | I32String | Envelope name (8 ints). |
| synchronized | int | *(Version 2+)* `1` if the envelope syncs to server time. |

## Envelope Points (type_id = 6)

There is exactly one envelope points item per map. It contains all envelope points for all envelopes, stored consecutively as 32-bit integers. Each point is **6 ints** in size:

| Field | Type | Description |
| ----- | :--: | :---------- |
| time | int | Timestamp in milliseconds. |
| curve_type | int | Curve type between this point and the next. |
| values[4] | int[4] | Point values (depends on envelope type). |

### Curve Types

| Value | Name | Description |
| ----- | :--- | :---------- |
| 0 | Step | Abrupt change at the next point. |
| 1 | Linear | Linear interpolation. |
| 2 | Slow | Slow start, fast end. |
| 3 | Fast | Fast start, slow end. |
| 4 | Smooth | Smooth easing. |

### Values by Envelope Type

- **Sound envelope**: `values[0]` = volume, `values[1..3]` = unused.
- **Position envelope**: `values[0]` = x, `values[1]` = y, `values[2]` = rotation, `values[3]` = unused.
- **Color envelope**: `values[0]` = r, `values[1]` = g, `values[2]` = b, `values[3]` = a.

:::info
Color values are stored as 32-bit integers representing the color component (0-255).
:::

## I32String Encoding

Some fields use a special string encoding called **I32String**. Instead of a data block index, the string is stored directly as consecutive 32-bit integers:

1. Each integer represents 4 characters packed as big-endian bytes.
2. Each byte has 128 added to it (wrapping subtraction is used to recover the original value).
3. The string is null-terminated (a `\0` byte in one of the integers).

Example decoding pseudo-code:

```c
for (i = 0; i < num_ints; i++) {
    int val = read_int()
    bytes = int_to_big_endian_bytes(val)

    for (b = 0; b < 4; b++) {
        char c = bytes[b] - 128
        if (c == '\0') break
        append_to_string(c)
    }
}
```