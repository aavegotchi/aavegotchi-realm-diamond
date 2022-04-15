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
    name: "Tile 1",
    width: 2,
    height: 2,
    deprecated: false,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25],
    craftTime: 0,
  },
  {
    id: 2,
    name: "Tile 2",
    width: 2,
    height: 2,
    deprecated: false,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25],
    craftTime: 0,
  },
  {
    id: 3,
    name: "Tile 3",
    width: 2,
    height: 2,
    deprecated: false,
    tileType: 0,
    alchemicaCost: [25, 25, 75, 25],
    craftTime: 0,
  },
];
