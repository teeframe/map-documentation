# Introduction

This documentation describes how Teeworlds maps are structured, loaded, and used at TeeFrame. It is based on the Teeworlds 0.6 datafile format and explains every map item type, layer, and the collision system.

## The Map Format

Teeworlds maps are stored in the **datafile format** — a binary container that holds fixed-size "items" along with variable-sized "data items". Maps use datafile version 3 or 4, with version 4 adding zlib compression for data blocks.

A map file contains everything needed to represent a game world: metadata, images, envelopes, groups, layers, and entity spawn positions.

## What to Expect

All content written here aims to describe and exemplify how maps work in a simplified and practical way. This documentation avoids technical terminology terms as much as possible.

It focuses exclusively on the **Teeworlds 0.6** map format and the **TeeFrame implementation**. DDNet-specific extensions (UUID items, auto mappers, additional physics layers) are not covered here.

## Credits

This documentation was created by [Miguilim](https://github.com/miguilimzero). The content is based on [libtw2 docs](https://github.com/heinrich5991/libtw2/tree/master/doc), [Teeworlds 0.6 Source](https://github.com/teeworlds/teeworlds/tree/0.6), and the TeeFrame source code.