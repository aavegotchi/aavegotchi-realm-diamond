//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { RealmFacet } from "../../typechain";
import { gasPrice, maticDiamondAddress } from "../helperFunctions";
import { auction1 } from "../../data/auction1";
import { Signer } from "@ethersproject/abstract-signer";

export async function syncParcels() {
  const accounts = await ethers.getSigners();

  let currentOwner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  let signer: Signer;

  // deploy DiamondCutFacet

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (hardhat.network.name === "matic") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticDiamondAddress,
    signer
  )) as RealmFacet;

  const maxProcess = 500;

  const batches = Math.ceil(auction1.length / maxProcess);
  console.log("batches:", batches);

  let currentBatch = 0;

  for (let index = 0; index < batches; index++) {
    console.log("Current batch:", currentBatch);
    const tokenIds = auction1.slice(
      maxProcess * currentBatch,
      maxProcess * currentBatch + maxProcess
    );

    const tx = await realmFacet.resyncParcel(tokenIds, { gasPrice: gasPrice });
    console.log("txhash:", tx.hash, tx.gasLimit.toString());
    await tx.wait();

    currentBatch++;
  }
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
