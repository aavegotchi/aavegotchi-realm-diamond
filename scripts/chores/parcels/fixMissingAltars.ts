import { network, ethers } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import {
  InstallationAdminFacet,
  InstallationFacet,
  InstallationUpgradeFacet,
  RealmFacet,
  RealmGettersAndSettersFacet,
} from "../../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { diamondOwner, gasPrice, impersonate } from "../../helperFunctions";
import { varsForNetwork } from "../../../constants";
import request from "graphql-request";
import { upgradeInstallation } from "../../installation/upgrades/upgrade-installationBalance";

export async function syncParcels() {
  let currentOwner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  await upgradeInstallation();

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  const currentBlock = await ethers.provider.getBlockNumber();

  const c = await varsForNetwork(ethers);

  // const parcelIds = ["46069", "40437", "40587"];
  const parcelIds = ["51234"];

  const installationsUpgradeFacet = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
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

  console.log("Finalize upgrades");
  // await installationsUpgradeFacet.finalizeUpgrades(["14150"]);

  // console.log("upgrades:", upgrades);

  // console.log("balances:", balance);

  for await (const parcelId of parcelIds) {
    console.log("PARCEL ID UPGRADES:", parcelId);

    const query = `{parcel(id:"${parcelId}") {
      id
      owner
    }}`;
    const parcelData = await request(
      "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic",
      query
    );

    const parcelOwner = parcelData.parcel.owner;

    const realmFacet = (await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      c.realmDiamond
    )) as RealmGettersAndSettersFacet;
    const parcelUpgradeLength = await realmFacet.getParcelUpgradeQueueLength(
      parcelId
    );
    const parcelUpgradeCapacity =
      await realmFacet.getParcelUpgradeQueueCapacity(parcelId);

    console.log("capacity:", parcelUpgradeLength, parcelUpgradeCapacity);

    //Get all pending upgrades for the parcel owner
    const userQueue = await installationsUpgradeFacet.getUserUpgradeQueueNew(
      parcelOwner
    );

    console.log("user queue:", userQueue);

    // console.log(
    //   "Pending upgrades:",
    //   userQueue.output_.filter((val) => val.parcelId.toString() === parcelId)
    // );

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

      //Filter out upgrades for other parcels
      if (upgrade.parcelId.toString() === parcelId) {
        if (upgrade.readyBlock > currentBlock) {
          console.log(`Upgrade ${upgradeIndex} not ready yet, skipping.`);
        } else {
          // const upgradeInfo = await installationsUpgradeFacet.getUpgradeQueueId(
          // upgradeIndex
          // );

          // console.log(`Upgrade info for ${upgradeIndex}:`, upgradeInfo);

          const foundBalance = balances.filter(
            (val) => val.installationId.toString() === installationId
          );

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
        }
      }

      // console.log("ready block:", upgrade.readyBlock);
      // console.log("current block:", currentBlock);

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
