import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network, run } from "hardhat";
import { gasPrice, varsForNetwork } from "../../../constants";

import { RealmGridFacet, RealmFacet } from "../../../typechain";

export async function harvesterUpgrade() {
  const c = await varsForNetwork(ethers);

  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  // Fix known grid problem
  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    c.realmDiamond,
    signer
  )) as RealmFacet;
  const realmGridFacet = (await ethers.getContractAt(
    "RealmGridFacet",
    c.realmDiamond,
    signer
  )) as RealmGridFacet;
  let tx = await realmFacet.fixGrid(49205, 0, [7, 7], [7, 8], false, {
    gasPrice: gasPrice,
  });
  console.log("Fixed grid tx:", tx.hash);
  console.log("new grid:");
  console.log(await realmGridFacet.getReasonableGrid(49205, 0));
}

if (require.main === module) {
  harvesterUpgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
