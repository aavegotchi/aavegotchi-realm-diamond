import { ethers, network } from "hardhat";
import { installationTypes } from "../../data/installations/bounceGate";
import {
  ERC721Facet,
  InstallationAdminFacet,
  TestRealmFacet,
} from "../../typechain";

import { outputInstallation } from "../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { BounceGateFacet } from "../../typechain/BounceGateFacet";
import { upgradeBounceGateTest } from "../realm/upgrades/upgrade-bounceGateTest";

export async function addFarmInstallations(test: boolean) {
  const c = await varsForNetwork(ethers);

  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
  }

  let bgFacet = (await ethers.getContractAt(
    "BounceGateFacet",
    c.realmDiamond,
    signer
  )) as BounceGateFacet;

  console.log("ins:", c.realmDiamond);

  const parcelId = "1";

  const erc721Facet = (await ethers.getContractAt(
    "ERC721Facet",
    c.realmDiamond
  )) as ERC721Facet;

  const owner = await erc721Facet.ownerOf(parcelId);
  console.log("owner:", owner);

  await upgradeBounceGateTest();

  if (network.name === "hardhat") {
    bgFacet = await impersonate(
      await erc721Facet.ownerOf(parcelId),
      bgFacet,
      ethers,
      network
    );
  }

  const testRealmFacet = (await ethers.getContractAt(
    "TestRealmFacet",
    c.realmDiamond
  )) as TestRealmFacet;

  const event = {
    _title: "Test Event 1",
    _startTime: Date.now(),
    _durationInMinutes: 86400 * 30, //30 days,
    _alchemicaSpent: ["0", "0", "0", "0"], //no priority,
    _realmId: parcelId,
  };

  const tx = await bgFacet.createEvent(
    event._title,
    event._startTime,
    event._durationInMinutes,
    //@ts-ignore
    event._alchemicaSpent,
    event._realmId,
    {
      gasPrice: gasPrice,
    }
  );
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addFarmInstallations(false)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
