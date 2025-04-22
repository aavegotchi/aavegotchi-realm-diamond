import { ethers, network } from "hardhat";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import {
  impersonate,
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
  maticTileDiamondAddress,
} from "./tile/helperFunctions";

export async function lockDiamonds() {
  let signer;

  const testing = ["hardhat", "localhost"].includes(network.name);
  let realmDiamond;
  let installationDiamond;
  let tileDiamond;

  if (testing) {
    const realmDiamondOwner = await getOwner(maticRealmDiamondAddress);
    realmDiamond = await ethers.getContractAt(
      "RealmFacet",
      maticRealmDiamondAddress
    );
    realmDiamond = await impersonate(
      realmDiamondOwner,
      realmDiamond,
      ethers,
      network
    );

    const installationDiamondOwner = await getOwner(
      maticInstallationDiamondAddress
    );
    installationDiamond = await ethers.getContractAt(
      "InstallationAdminFacet",
      maticInstallationDiamondAddress
    );
    installationDiamond = await impersonate(
      installationDiamondOwner,
      installationDiamond,
      ethers,
      network
    );

    const tileDiamondOwner = await getOwner(maticTileDiamondAddress);
    tileDiamond = await ethers.getContractAt(
      "TileFacet",
      maticTileDiamondAddress
    );
    tileDiamond = await impersonate(
      tileDiamondOwner,
      tileDiamond,
      ethers,
      network
    );
  } else if (network.name === "matic") {
    //item manager - ledger
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else throw Error("Incorrect network selected");

  let tx = await realmDiamond.setDiamondPaused(true);
  await tx.wait();
  console.log("Realm diamond paused at txn", tx.hash);
  tx = await installationDiamond.setDiamondPaused(true);
  await tx.wait();
  console.log("Installation diamond paused at txn", tx.hash);
  tx = await tileDiamond.setDiamondPaused(true);
  await tx.wait();
  console.log("Forge diamond paused at txn", tx.hash);
  console.log("Diamonds paused");
}

async function getOwner(address: string) {
  const ownershipFacet = await ethers.getContractAt("OwnershipFacet", address);
  const owner = await ownershipFacet.owner();
  return owner;
}

if (require.main === module) {
  lockDiamonds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
