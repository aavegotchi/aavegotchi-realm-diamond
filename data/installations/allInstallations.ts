import { installationTypes as bounceGates } from "./bounceGate";
import { installationTypes as farming } from "./farming";
import { goldenAltars } from "./goldenAltars";
import { installationTypes as grandFountain } from "./graandFountain";
import { installationTypes as halloween } from "./halloween";
import { installationTypes as iTypes } from "./installationTypes";
import { installationTypes as nftDisplayBig } from "./nftDisplay_big";
import { installationTypes as nftdisplay } from "./nftDisplay";
import { installationTypes as xmas } from "./xmas";

import { BigNumber } from "ethers";

export function getInstallationDimensions(id: number): {
  width: number;
  height: number;
} {
  const allInstallations = [
    ...bounceGates,
    ...farming,
    ...goldenAltars,
    ...grandFountain,
    ...halloween,
    ...iTypes,
    ...nftDisplayBig,
    ...nftdisplay,
    ...xmas,
  ];

  const installation = allInstallations.find((i) => i.id === id);

  if (!installation) {
    throw new Error(`Installation with id ${id} not found`);
  }

  const dimensions = { width: installation.width, height: installation.height };
  return dimensions;
}

export function countInstallationOccurrences(
  grid: number[][]
): { id: number; amount: number }[] {
  const installationCounts: { [id: number]: number } = {};
  const gridSize = grid.length;

  //if grid is empty return empty array
  if (gridSize === 0) return [];

  // Create a boolean grid to mark visited cells
  const visited: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const installationId = grid[y][x];
      if (installationId !== 0 && !visited[y][x]) {
        const { width, height } = getInstallationDimensions(installationId);

        // Check if a valid installation exists starting at (x, y)
        let isValidInstallation = true;
        for (let i = y; i < y + height; i++) {
          for (let j = x; j < x + width; j++) {
            if (
              i >= gridSize ||
              j >= gridSize ||
              grid[i][j] !== installationId
            ) {
              isValidInstallation = false;
              break;
            }
          }
          if (!isValidInstallation) break;
        }

        if (isValidInstallation) {
          installationCounts[installationId] =
            (installationCounts[installationId] || 0) + 1;
          // Mark visited cells
          for (let i = y; i < y + height; i++) {
            for (let j = x; j < x + width; j++) {
              visited[i][j] = true;
            }
          }
        }
      }
    }
  }
  return Object.entries(installationCounts).map(([id, amount]) => ({
    id: parseInt(id),
    amount,
  }));
}
