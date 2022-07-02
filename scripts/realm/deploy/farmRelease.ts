//@ts-ignore
import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { AlchemicaFacet } from "../../../typechain";
import { getDiamondSigner } from "../../helperFunctions";
import { addFarmInstallations } from "../../installation/updates/addFarmInstallations";
import { alchemicaTotals } from "../../setVars";
import { harvesterUpgrade } from "../upgrades/upgrade-haarvesterRelease";

export async function deployMatic() {
  const c = await varsForNetwork(ethers);

  console.log(
    `Deploying farm release on ${network.name} with Realm Diamond address ${c.realmDiamond}`
  );

  let signer = await getDiamondSigner(
    c.realmDiamond,
    ethers,
    network.name,
    true
  );

  console.log("Deploy upgrade");

  if (["matic", "hardhat"].includes(network.name)) {
    await addFarmInstallations();
  }

  await harvesterUpgrade();
  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond,
    signer
  )) as AlchemicaFacet;

  console.log("Set alchemica totals");
  //@ts-expect-error
  let tx = await alchemicaFacet.setTotalAlchemicas(alchemicaTotals());
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployMatic()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
