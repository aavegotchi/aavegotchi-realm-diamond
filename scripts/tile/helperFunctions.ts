import { TileTypeInput, TileTypeOutput } from "../../types";
import { BigNumber } from "ethers";

export function outputTile(tile: TileTypeInput, ethers: any): TileTypeOutput {
  if (tile.width > 64) throw new Error("Width too much");
  if (tile.height > 64) throw new Error("Height too much");

  const alchemica = tile.alchemicaCost.map((val) =>
    ethers.utils.parseEther(val.toString())
  );

  let output: TileTypeOutput = {
    width: tile.width,
    height: tile.height,
    deprecated: tile.deprecated,
    tileType: tile.tileType,
    craftTime: tile.craftTime,
    alchemicaCost: [
      BigNumber.from(alchemica[0]),
      BigNumber.from(alchemica[1]),
      BigNumber.from(alchemica[2]),
      BigNumber.from(alchemica[3]),
    ],
    name: tile.name,
  };

  return output;
}
