import { network, ethers } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import {
  InstallationAdminFacet,
  InstallationFacet,
  InstallationUpgradeFacet,
  RealmFacet,
} from "../../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { diamondOwner, gasPrice, impersonate } from "../../helperFunctions";
import { varsForNetwork } from "../../../constants";
import request from "graphql-request";

export async function syncParcels() {
  let currentOwner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  // if (testing) {
  //   await network.provider.request({
  //     method: "hardhat_impersonateAccount",
  //     params: [currentOwner],
  //   });
  //   signer = await ethers.provider.getSigner(currentOwner);
  // } else if (network.name === "matic") {
  //   signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  // } else {
  //   throw Error("Incorrect network selected");
  // }

  const currentBlock = await ethers.provider.getBlockNumber();

  const c = await varsForNetwork(ethers);

  // const parcelIds = ["46069", "40437", "40587"];
  const parcelIds = ["545"];

  const installationsUpgradeFacet = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationAdminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  // console.log("upgrades:", upgrades);

  // console.log("balances:", balance);

  for await (const parcelId of parcelIds) {
    const query = `{parcel(id:"${parcelId}") {
      id
      owner
    }}`;
    const parcelData = await request(
      "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic",
      query
    );

    const parcelOwner = parcelData.parcel.owner;

    //Get all pending upgrades for the parcel owner
    const userQueue = await installationsUpgradeFacet.getUserUpgradeQueue(
      parcelOwner
    );

    console.log(
      "Pending upgrades:",
      userQueue.output_.filter((val) => val.parcelId.toString() === parcelId)
    );

    let i = 0;
    for await (const upgrade of userQueue.output_) {
      const upgradeIndex = userQueue.indexes_[i];

      const installationId = upgrade.installationId.toString();

      //Only altars
      // if (Number(installationId) <= 18) {
      const balances = await installationFacet.installationBalancesOfToken(
        c.realmDiamond,
        parcelId
      );

      const foundBalance = balances.filter(
        (val) => val.installationId.toString() === installationId
      );

      if (upgrade.readyBlock > currentBlock) {
        console.log("Upgrade not ready yet, skipping.");
        continue;
      }

      if (foundBalance) {
        console.log(
          `Parcel has a balance of token ${installationId}. Upgrade ${upgradeIndex} can likely be executed.`
        );
      } else {
        console.log(
          `Parcel does NOT have a balance of token ${installationId}. Upgrade ${upgradeIndex} cannot be executed.`
        );

        const missingAltar = {
          _parcelId: parcelId,
          _oldAltarId: "11",
          _newAltarId: "12",
        };
      }
      i++;
    }

    // }
  }

  // console.log("user upgrades:", userUpgrades);

  //  const tx =  await installationAdminFacet.fixMissingAltars([missingAltar], {
  //     gasPrice: gasPrice,
  //   });

  // console.log("balances:", balance);

  // const upgrades = await installationsUpgradeFacet.getUserUpgradeQueueNew(
  //   "0xea651e5b72751f1d2e36255f5f59792c84cd856f"
  // );

  // console.log("upgrades:", upgrades);

  // const upgradeInfo = await installationsUpgradeFacet.getUpgradeQueueId(
  //   "10232"
  // );
  // console.log("info:", upgradeInfo);

  // await installationsUpgradeFacet.finalizeUpgrades(["10232"], {
  //   gasPrice: gasPrice,
  // });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  syncParcels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
