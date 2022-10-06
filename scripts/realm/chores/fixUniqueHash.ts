import { ethers, network } from "hardhat";
import {
  ERC721Facet,
  InstallationAdminFacet,
  InstallationUpgradeFacet,
} from "../../../typechain";

import { gasPrice, varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { diamondOwner, impersonate } from "../../helperFunctions";
import { upgrade } from "../../installation/upgrades/upgrade-fixUpgradeQueue";
import { UpgradeQueue } from "../../../types";
import { genUpgradeInstallationSignature } from "../realmHelpers";

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

  const parcelId = 5328;
  const x = 7;
  const y = 7;
  const installationId = 10;
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

  // await upgrade();

  console.log("owner:", owner);

  //kokusho 2
  /*  {
    "id": "53490-74-2-58-30955428",
    "installationId": "74",
    "x": "2",
    "y": "58"
  }, */

  const beforeHash = await adminFacet.getUniqueHash(
    parcelId,
    x,
    y,
    installationId
  );

  console.log("hash:", beforeHash);

  console.log("Deleting bugged upgrade");
  let tx = await adminFacet.deleteBuggedUpgrades(
    parcelId,
    x,
    y,
    installationId,
    { gasPrice: gasPrice }
  );
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
