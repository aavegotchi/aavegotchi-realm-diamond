import { ethers, network } from "hardhat";
import { ERC20, ERC721Facet } from "../../typechain";

import { gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../constants";
//import { LedgerSigner } from "@anders-t/ethers-ledger";
import { BounceGateFacet } from "../../typechain/BounceGateFacet";
import { Signer } from "ethers";
import { upgradeBounceGateTest } from "../realm/upgrades/upgrade-bounceGateTest";

export async function addFarmInstallations(test: boolean) {
  const c = await varsForNetwork(ethers);

  let signer: Signer;

  if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
  }
  const realmDiamond = "0x726F201A9aB38cD56D60ee392165F1434C4F193D";

  let bgFacet = (await ethers.getContractAt(
    "BounceGateFacet",
    realmDiamond,
    signer
  )) as BounceGateFacet;

  console.log("ins:", realmDiamond);

  const parcelId = "1";

  const erc721Facet = (await ethers.getContractAt(
    "ERC721Facet",
    realmDiamond
  )) as ERC721Facet;

  const owner = await erc721Facet.ownerOf(parcelId);
  console.log("owner:", owner);

  await upgradeBounceGateTest();

  // if (network.name === "hardhat" || "localhost") {
  //   bgFacet = await impersonate(
  //     await erc721Facet.ownerOf(parcelId),
  //     bgFacet,
  //     ethers,
  //     network
  //   );
  // }

  const event = {
    _title: "Test Event 1",
    _startTime: (Date.now() / 1000).toFixed(),
    _durationInMinutes: 86400 * 30, //30 days,
    _alchemicaSpent: ["0", "0", "0", "0"], //no priority,
    _realmId: parcelId,
  };

  console.log("Adding event");
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
