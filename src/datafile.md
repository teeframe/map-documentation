# Datafile

This page describes the .map file format — the binary container that Teeworlds uses to store game maps. Every .map file is a datafile. Understanding this format is the first step to loading and reading map data.

## Version Header

Every datafile starts with a version header that identifies the file format:

```sh
byte[0-3]  // magic  - must be "DATA" (or "ATAD" reversed)
byte[4-7]  // version - 3 or 4 (little-endian signed 32-bit integer)
```

:::info
Readers should accept both `DATA` and `ATAD` as valid magic bytes. A bug in the reference implementation caused big-endian machines to save the reversed bytes.
:::

## Header

The header follows the version header and contains size information for the rest of the file:

```sh
byte[8-11]   // size             - size of the datafile without the version header
byte[12-15]  // swaplen          - bytes that contain integers (for endian swapping)
byte[16-19]  // num_item_types   - number of item types
byte[20-23]  // num_items        - total number of items
byte[24-27]  // num_data         - number of raw data blocks
byte[28-31]  // item_size        - total size of the items section (bytes)
byte[32-35]  // data_size        - total size of the data section (bytes)
```

All values are little-endian signed 32-bit integers.

## Item Types

Each item type groups items of the same kind (e.g., layers, images, envelopes). The item types section comes after the header:

```sh
// repeated num_item_types times:
byte[*-...]  // type_id - unique numeric type identifier
byte[*-...]  // start   - index of the first item of this type
byte[*-...]  // num     - number of items of this type
```

### Version 3 & 4 Type IDs

In Teeworlds 0.6, the item type IDs are:

| Type ID | Name |
| --------| :--- |
| 0 | Version |
| 1 | Info |
| 2 | Images |
| 3 | Envelopes |
| 4 | Groups |
| 5 | Layers |
| 6 | Envelope Points |

## Item Offsets & Data Offsets

After item types, the file contains arrays of 32-bit integers for quick access:

```sh
byte[*-...]  // item_offsets  - one int per item (offset relative to first item)
byte[*-...]  // data_offsets  - one int per data block (offset relative to first data block)
byte[*-...]  // data_sizes    - one int per data block (uncompressed size, version 4 only)
```

:::info
The `data_sizes` section is only present in **version 4** datafiles. It contains the uncompressed size of each data block.
:::

## Items

Items contain metadata for the map. Each item has a type, an ID, and type-specific data:

```sh
// repeated for each item:
byte[*-...]  // type_id_and_id - upper 16 bits = type_id, lower 16 bits = id
byte[*-...]  // size           - size of item_data in bytes (must be divisible by 4)
byte[*-...]  // item_data      - type-specific data (array of 32-bit integers)
```

## Data

The data section contains raw data blocks (tile data, image data, etc.):

```sh
// concatenated data blocks:
byte[*-...]  // data block 0
byte[*-...]  // data block 1
// ...
```

### Version 3

In version 3, data blocks are stored uncompressed, concatenated in order. Each block's start position and size are determined by the `data_offsets` array.

### Version 4

In version 4, each data block is individually compressed with **zlib**. The `data_offsets` point into the compressed stream, and the `data_sizes` array provides the uncompressed size for each block. To extract a block:

1. Read `data_offsets[i]` and `data_offsets[i+1]` (or `data_size` for the last block) to get the compressed byte range.
2. Extract the compressed bytes from the file.
3. Decompress using zlib to obtain the original data.

:::info
The TeeFrame `MapReader` class handles both version 3 and version 4 datafiles automatically, decompressing each block when needed.
:::