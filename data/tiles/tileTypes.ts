import { TileTypeInput } from "../../types";

export const tileTypes: TileTypeInput[] = [
  {
    id: 0,
    name: "The Void",
    width: 1,
    height: 1,
    deprecated: true,
    tileType: 0,
    alchemicaCost: [0, 0, 0, 0],
    craftTime: 0,
  },
  {
    id: 1,
    name: "LE Golden Tile - Gotchiverse",
    width: 8,
    height: 8,
    deprecated: true,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25],
    craftTime: 0,
  },
  {
    id: 2,
    name: "LE Golden Tile - Portal",
    width: 8,
    height: 8,
    deprecated: true,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25],
    craftTime: 0,
  },
  {
    id: 3,
    name: "LE Golden Tile - Gotchi",
    width: 8,
    height: 8,
    deprecated: true,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25],
    craftTime: 0,
  },
  {
    id: 4,
    name: "LE Purple Grass",
    width: 4,
    height: 4,
    deprecated: false,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25], // TODO: Check this
    craftTime: 0,
  },
  {
    id: 5,
    name: "LE Rug", // TODO: Check this
    width: 16,
    height: 4,
    deprecated: false,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25], // TODO: Check this
    craftTime: 0,
  },
];
