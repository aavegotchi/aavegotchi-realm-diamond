//@ts-ignore
import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { AlchemicaFacet } from "../../../typechain";
import { getDiamondSigner } from "../../helperFunctions";
import { addFarmInstallations } from "../../installation/updates/addFarmInstallations";
import { alchemicaTotals } from "../../setVars";
import { setVRF } from "../chores/setVRF";
import { harvesterUpgrade } from "../upgrades/upgrade-haarvesterReleaseFinal";

export async function deployFarmRelease() {
  const c = await varsForNetwork(ethers);

  console.log(
    `Deploying farm release on ${network.name} with Realm Diamond address ${c.realmDiamond}`
  );

  console.log("Run upgrade");
  await harvesterUpgrade();

  let signer = await getDiamondSigner(c.realmDiamond, ethers, network, true);

  if (network.config.chainId === 137 && network.name === "hardhat") {
    console.log("Add test installations");
    await addFarmInstallations(false);
  } else {
    console.log("Add real installations");
    await addFarmInstallations(false);
  }

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond,
    signer
  )) as AlchemicaFacet;

  console.log("Set alchemica totals");
  //@ts-ignore
  let tx = await alchemicaFacet.setTotalAlchemicas(alchemicaTotals());
  await tx.wait();

  return true;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployFarmRelease()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
