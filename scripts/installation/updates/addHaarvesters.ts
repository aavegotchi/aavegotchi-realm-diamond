import { ethers, network } from "hardhat";
import {
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
} from "../../../constants";
import { haarvesters } from "../../../data/installations/haarvesters";
import { maaker } from "../../../data/installations/maaker";
import { reservoirs } from "../../../data/installations/reservoirs";
import {
  InstallationAdminFacet,
  InstallationFacet,
  VRFFacet,
} from "../../../typechain";
import { upgrade } from "../../realm/upgrades/upgrade-haarvesterRelease";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";

export async function addHaarvesters() {
  /// UPGRADE REALM CONTRACT ///
  await upgrade();

  /// ADD NEW INSTALLATIONS ///

  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
    signer
  )) as InstallationAdminFacet;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    installationAdminFacet = await impersonate(
      await diamondOwner(maticInstallationDiamondAddress, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  const haarvesterInstallations = haarvesters.map((val) =>
    outputInstallation(val)
  );
  const maakerInstallations = maaker.map((val) => outputInstallation(val));
  const reservoirInstallations = reservoirs.map((val) =>
    outputInstallation(val)
  );

  console.log("Adding installation types!");

  console.log("haarvesters:", haarvesterInstallations);
  console.log("maaker:", maakerInstallations);
  console.log("reservoirs:", reservoirInstallations);

  let tx = await installationAdminFacet.addInstallationTypes(
    haarvesterInstallations,
    {
      gasPrice: gasPrice,
    }
  );
  console.log("hash:", tx.hash);
  await tx.wait();
  console.log("Haarvesters Added!");

  tx = await installationAdminFacet.addInstallationTypes(maakerInstallations, {
    gasPrice: gasPrice,
  });
  console.log("hash:", tx.hash);
  await tx.wait();
  console.log("Maakers Added!");

  tx = await installationAdminFacet.addInstallationTypes(
    reservoirInstallations,
    {
      gasPrice: gasPrice,
    }
  );
  console.log("hash:", tx.hash);
  await tx.wait();
  console.log("Reservoirs Added!");

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([]);
  console.log("insts:", insts);

  /// SETUP VRF ///

  let vrfFacet = (await ethers.getContractAt(
    "VRFFacet",
    maticRealmDiamondAddress,
    signer
  )) as VRFFacet;

  if (testing) {
    vrfFacet = await impersonate(
      await diamondOwner(maticInstallationDiamondAddress, ethers),
      vrfFacet,
      ethers,
      network
    );
  }

  const requestConfig = {
    subId: 114,
    callbackGasLimit: 2000000,
    requestConfirmations: 3,
    numWords: 4,
    keyHash:
      "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
  };

  tx = await vrfFacet.setConfig(requestConfig, {
    gasPrice: gasPrice,
  });
  await tx.wait();
  console.log("VRF Config Set!");

  tx = await vrfFacet.setVrfCoordinator(
    "0xAE975071Be8F8eE67addBC1A82488F1C24858067"
  );
  await tx.wait();
  console.log("VRF Coordinator Set!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addHaarvesters()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
