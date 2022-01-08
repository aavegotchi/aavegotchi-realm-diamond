import { ethers } from "ethers";
import { InstallationTypeInput, InstallationTypeOutput } from "../../types";

export function outputInstallation(
  installation: InstallationTypeInput
): InstallationTypeOutput {
  if (installation.level > 9) throw new Error("Level too high");
  if (installation.width > 64) throw new Error("Width too much");
  if (installation.height > 64) throw new Error("Height too much");

  let output: InstallationTypeOutput = {
    deprecated: false,
    installationType: installation.installationType,
    level: installation.level,
    width: installation.width,
    height: installation.height,
    alchemicaType: installation.alchemicaType,
    alchemicaCost: installation.alchemicaCost.map((val) =>
      ethers.utils.parseEther(val.toString())
    ),
    harvestRate: ethers.utils.parseEther(installation.harvestRate.toString()),
    capacity: ethers.utils.parseEther(installation.capacity.toString()),
    spillRadius: installation.spillRadius,
    spillRate: installation.spillRate,
    craftTime: installation.craftTime,
    nextLevelId: installation.nextLevelId,
    prerequisites: installation.prerequisites,
  };

  return output;
}

export function testInstallations() {
  const installations: InstallationTypeOutput[] = [];
  installations.push(
    outputInstallation({
      installationType: 0,
      level: 0,
      width: 0,
      height: 0,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 0,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    })
  );
  installations.push(
    outputInstallation({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [0.01, 0.2, 0, 0.03],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    })
  );
  installations.push(
    outputInstallation({
      installationType: 1,
      level: 1,
      width: 4,
      height: 4,
      alchemicaType: 3,
      alchemicaCost: [0.04, 0.05, 0.06, 0.06],
      harvestRate: 0,
      capacity: 50000,
      spillRadius: 100,
      spillRate: 100,
      craftTime: 20000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    })
  );

  return installations;
}
