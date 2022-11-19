import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/installationTypes";
import {
  InstallationAdminFacet,
  InstallationFacet,
  InstallationUpgradeFacet,
} from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import {
  genUpgradeInstallationSignature,
  outputInstallation,
} from "../../realm/realmHelpers";
import { gasPrice, impersonate } from "../helperFunctions";
import { alchemica, varsForNetwork } from "../../../constants";
import {
  aavegotchiDAOAddress,
  maticAavegotchiDiamondAddress,
  pixelcraftAddress,
} from "../../helperFunctions";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";
import { upgradeInstallation } from "../upgrades/upgrade-installationBalance";
import { editInstallationTypes } from "./editAltars";

export async function testUpgrade() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const c = await varsForNetwork(ethers);

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationFacet = await impersonate(
      "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119",
      installationFacet,
      ethers,
      network
    );
  }

  const owner = "0x501ffc7Ee44f7986c24FB5bf7C04c1ED6377ec87";

  let upgradeFacet = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;

  upgradeFacet = await impersonate(owner, upgradeFacet, ethers, network);

  await upgradeInstallation();

  await editInstallationTypes();

  const parcelId = 27706;
  const gotchiId = 0;
  const installationId = 7;
  const coordinateX = 32;
  const coordinateY = 15;

  const queue = {
    owner: owner,
    coordinateX: coordinateX,
    coordinateY: coordinateY,
    readyBlock: "0",
    claimed: false,
    parcelId: parcelId,
    installationId: installationId,
  };

  const ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    c.installationDiamond
  );

  let adminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond
  )) as InstallationAdminFacet;

  adminFacet = await impersonate(
    await ownershipFacet.owner(),
    adminFacet,
    ethers,
    network
  );

  const sig = await genUpgradeInstallationSignature(
    Number(parcelId),
    coordinateX,
    coordinateY,
    installationId,
    gotchiId
  );
  const tx = await upgradeFacet.upgradeInstallation(queue, gotchiId, sig, 0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  testUpgrade()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
