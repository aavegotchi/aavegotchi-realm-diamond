import { ethers, network } from "hardhat";
import {
  ERC721Facet,
  InstallationAdminFacet,
  InstallationUpgradeFacet,
} from "../../../typechain";

import {
  gasPrice,
  gotchiverseSubgraph,
  varsForNetwork,
} from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { diamondOwner, impersonate } from "../../helperFunctions";
import { upgrade } from "../../installation/upgrades/upgrade-fixUpgradeQueue";
import { UpgradeQueue } from "../../../types";
import { genUpgradeInstallationSignature } from "../realmHelpers";
import request from "graphql-request";

export async function setAddresses() {
  const c = await varsForNetwork(ethers);

  let installationFacet = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond,
    await ethers.getSigners()[0]
  )) as InstallationUpgradeFacet;

  let adminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as InstallationAdminFacet;

  const realmFacet = (await ethers.getContractAt(
    "ERC721Facet",
    c.realmDiamond
  )) as ERC721Facet;

  const parcelId = 11646;
  const x = 30;
  const y = 18;
  const installationId = 67;
  const gotchiId = 0;

  const owner = await realmFacet.ownerOf(parcelId);

  if (network.name === "hardhat") {
    installationFacet = await impersonate(
      owner,
      installationFacet,
      ethers,
      network
    );

    adminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      adminFacet,
      ethers,
      network
    );
  }

  await upgrade();

  const query = `
  {installationUpgradedEvents(where:{parcel:"${parcelId}"}) {
    id
    prevInstallation {
      id
    }
    x
    y
  }}
  `;

  interface Upgrade {
    installationUpgradedEvents: {
      id: string;
      prevInstallation: {
        id: string;
      };
      x: string;
      y: string;
    }[];
  }

  const allUpgrades: Upgrade = await request(gotchiverseSubgraph, query);

  console.log("upgrades:", allUpgrades);

  for (let i = 0; i < allUpgrades.installationUpgradedEvents.length; i++) {
    const upgrade = allUpgrades.installationUpgradedEvents[i];

    const beforeHash = await adminFacet.getUniqueHash(
      parcelId,
      upgrade.x,
      upgrade.y,
      upgrade.prevInstallation.id
    );

    console.log(
      `Before Hash for ${x}, ${y} of ${upgrade.prevInstallation.id}:`,
      beforeHash
    );
  }

  const upgrade1 = {
    _parcelId: parcelId,
    _coordinateX: x,
    _coordinateY: y,
    _installationId: installationId,
  };

  console.log("Deleting bugged upgrade");
  let tx = await adminFacet.deleteBuggedUpgrades([upgrade1], {
    gasPrice: gasPrice,
  });
  await tx.wait();

  const afterHash = await adminFacet.getUniqueHash(
    parcelId,
    x,
    y,
    installationId
  );

  console.log("hash:", afterHash);

  const upgradeQueueAlt: UpgradeQueue = {
    parcelId: parcelId,
    coordinateX: x,
    coordinateY: y,
    installationId: installationId,
    readyBlock: 0,
    claimed: false,
    owner,
  };
  const signatureAlt = await genUpgradeInstallationSignature(
    parcelId,
    x,
    y,
    installationId,
    gotchiId
  );
  // tx = await installationFacet.upgradeInstallation(
  //   upgradeQueueAlt,
  //   gotchiId,
  //   signatureAlt,
  //   0
  // );

  // await tx.wait();

  // const queue = await installationFacet.getParcelUpgradeQueue(owner);

  // console.log(queue);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
