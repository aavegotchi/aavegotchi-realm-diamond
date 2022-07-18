import { network, ethers } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { RealmFacet } from "../../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { gasPrice } from "../../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function syncParcels() {
  const accounts = await ethers.getSigners();

  const c = await varsForNetwork(ethers);
  const testing = ["hardhat", "localhost"].includes(network.name);

  const currentOwner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  let signer;

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

  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    c.realmDiamond,
    signer
  )) as RealmFacet;

  const tx = await realmFacet.setFreezeBuilding(false, { gasPrice: gasPrice });
  await tx.wait();
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
