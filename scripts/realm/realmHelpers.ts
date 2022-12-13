import { BigNumber, ethers } from "ethers";
import { network } from "hardhat";
import { Network } from "hardhat/types";
import { AlchemicaToken, GLTR } from "../../typechain";
import {
  InstallationTypeInput,
  TileTypeInput,
  InstallationTypeOutput,
  TileTypeOutput,
  TestBeforeVars,
} from "../../types";

import { impersonate } from "../installation/helperFunctions";

export function outputInstallation(
  installation: InstallationTypeInput
): InstallationTypeOutput {
  if (installation.width > 64) throw new Error("Width too much");
  if (installation.height > 64) throw new Error("Height too much");

  const alchemica = installation.alchemicaCost.map((val) =>
    ethers.utils.parseEther(val.toString())
  );

  const harvestRate = ethers.utils.parseEther(
    installation.harvestRate.toString()
  );

  //Altar spilloverRate is parsed in 2 units, reservoirs are parsed in 4
  const isAltar = installation.id <= 18 ? true : false;

  console.log("spill rate:", installation.spillRate.toString());

  let output: InstallationTypeOutput = {
    deprecated: installation.deprecated,
    installationType: installation.installationType,
    level: installation.level,
    width: installation.width,
    height: installation.height,
    alchemicaType: installation.alchemicaType,
    alchemicaCost: [
      BigNumber.from(alchemica[0]),
      BigNumber.from(alchemica[1]),
      BigNumber.from(alchemica[2]),
      BigNumber.from(alchemica[3]),
    ],
    harvestRate: harvestRate,
    capacity: ethers.utils.parseEther(installation.capacity.toString()),
    spillRadius: installation.spillRadius,
    spillRate: ethers.utils.parseUnits(
      installation.spillRate.toString(),
      isAltar ? 2 : 4
    ),
    upgradeQueueBoost: installation.upgradeQueueBoost,
    craftTime: installation.craftTime,
    nextLevelId: installation.nextLevelId,
    prerequisites: installation.prerequisites,
    name: installation.name,
    unequipType: installation.unequipType,
    deprecateTime: installation.deprecateTime ? installation.deprecateTime : 0,
  };

  return output;
}

export function outputTile(tile: TileTypeInput): TileTypeOutput {
  if (tile.width > 64) throw new Error("Width too much");
  if (tile.height > 64) throw new Error("Height too much");

  let output: TileTypeOutput = {
    deprecated: false,
    tileType: tile.tileType,
    width: tile.width,
    height: tile.height,
    alchemicaCost: [
      ethers.utils.parseEther(tile.alchemicaCost[0].toString()),
      ethers.utils.parseEther(tile.alchemicaCost[1].toString()),
      ethers.utils.parseEther(tile.alchemicaCost[2].toString()),
      ethers.utils.parseEther(tile.alchemicaCost[3].toString()),
    ],
    craftTime: tile.craftTime,
    name: tile.name,
  };

  return output;
}

const backendSigner = () => {
  //@ts-ignore
  return new ethers.Wallet(process.env.PROD_PK); // PK should start with '0x'
};

export const genEquipInstallationSignature = async (
  parcelId: number,
  gotchiId: number,
  tileId: number,
  x: number,
  y: number
) => {
  let messageHash1 = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "uint256", "uint256", "uint256"],
    [parcelId, gotchiId, tileId, x, y]
  );
  let signedMessage1 = await backendSigner().signMessage(
    ethers.utils.arrayify(messageHash1)
  );
  let signature1 = ethers.utils.arrayify(signedMessage1);

  return signature1;
};

export const genUpgradeInstallationSignature = async (
  realmId: number,
  coordinateX: number,
  coordinateY: number,
  installationId: number
) => {
  let messageHash = ethers.utils.solidityKeccak256(
    ["uint256", "uint16", "uint16", "uint256"],
    [realmId, coordinateX, coordinateY, installationId]
  );
  let signedMessage = await backendSigner().signMessage(
    ethers.utils.arrayify(messageHash)
  );
  let signature = ethers.utils.arrayify(signedMessage);
  return signature;
};

export const genClaimAlchemicaSignature = async (
  parcelId: number,
  gotchiId: number,
  lastClaimed: BigNumber
) => {
  let messageHash = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "uint256"],
    [parcelId, gotchiId, lastClaimed]
  );
  let signedMessage = await backendSigner().signMessage(
    ethers.utils.arrayify(messageHash)
  );
  let signature = ethers.utils.arrayify(signedMessage);

  return signature;
};

export const genChannelAlchemicaSignature = async (
  parcelId: number,
  gotchiId: number,
  lastChanneled: BigNumber
) => {
  let messageHash = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "uint256"],
    [parcelId, gotchiId, lastChanneled]
  );
  let signedMessage = await backendSigner().signMessage(
    ethers.utils.arrayify(messageHash)
  );
  let signature = ethers.utils.arrayify(signedMessage);

  return signature;

  // signedMessage = await backendSigner.signMessage(messageHash);
};

export const genReduceUpgradeTimeSignature = async (upgradeIndex: number) => {
  let messageHash = ethers.utils.solidityKeccak256(["uint256"], [upgradeIndex]);
  let signedMessage = await backendSigner().signMessage(
    ethers.utils.arrayify(messageHash)
  );
  let signature = ethers.utils.arrayify(signedMessage);

  return signature;
};

export async function faucetRealAlchemica(receiver: string, ethers: any) {
  const alchemica = [
    "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
    "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
    "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
    "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  ];

  for (let i = 0; i < alchemica.length; i++) {
    const alchemicaToken = alchemica[i];
    let token = (await ethers.getContractAt(
      "AlchemicaToken",
      alchemicaToken
    )) as AlchemicaToken;
    token = await impersonate(await token.owner(), token, ethers, network);
    await token.mint(receiver, ethers.utils.parseEther("10000"));
  }
}

export async function approveRealAlchemica(
  address: string,
  installationAddress: string,
  ethers: any
) {
  const alchemica = [
    "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
    "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
    "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
    "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  ];

  for (let i = 0; i < alchemica.length; i++) {
    const alchemicaToken = alchemica[i];
    let token = (await ethers.getContractAt(
      "AlchemicaToken",
      alchemicaToken
    )) as AlchemicaToken;
    token = await impersonate(address, token, ethers, network);
    await token.approve(
      installationAddress,
      ethers.utils.parseUnits("1000000000")
    );
  }
}

export async function approveAlchemica(
  g: TestBeforeVars,
  ethers: any,
  address: string,
  network: Network
) {
  g.fud = await impersonate(address, g.fud, ethers, network);
  g.fomo = await impersonate(address, g.fomo, ethers, network);
  g.alpha = await impersonate(address, g.alpha, ethers, network);
  g.kek = await impersonate(address, g.kek, ethers, network);

  await g.fud.approve(
    g.installationsAddress,
    ethers.utils.parseUnits("1000000000")
  );
  await g.fomo.approve(
    g.installationsAddress,
    ethers.utils.parseUnits("1000000000")
  );
  await g.alpha.approve(
    g.installationsAddress,
    ethers.utils.parseUnits("1000000000")
  );
  await g.kek.approve(
    g.installationsAddress,
    ethers.utils.parseUnits("1000000000")
  );

  return g;
}

export async function mintAlchemica(
  g: TestBeforeVars,
  ethers: any,
  owner: string,
  to: string,
  network: Network,
  amount: BigNumber
) {
  g.fud = await impersonate(owner, g.fud, ethers, network);
  g.fomo = await impersonate(owner, g.fomo, ethers, network);
  g.alpha = await impersonate(owner, g.alpha, ethers, network);
  g.kek = await impersonate(owner, g.kek, ethers, network);

  await g.fud.mint(to, amount);
  await g.fomo.mint(to, amount);
  await g.alpha.mint(to, amount);
  await g.kek.mint(to, amount);

  return g;
}
