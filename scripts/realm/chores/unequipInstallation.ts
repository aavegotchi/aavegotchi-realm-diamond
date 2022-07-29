import { ethers, network } from "hardhat";
import { RealmFacet } from "../../../typechain";
import { varsForNetwork } from "../../../constants";
import { impersonate } from "../../helperFunctions";
import { genEquipInstallationSignature } from "../realmHelpers";
import { upgradeRealm } from "../upgrades/upgrade-realmTest";

export async function unequipInstallation() {
  const c = await varsForNetwork(ethers);

  await upgradeRealm();

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    c.realmDiamond
  )) as RealmFacet;
  realmFacet = await impersonate(
    "0x505d867c40931bf56393f23cfa766fff8fa406e3",
    realmFacet,
    ethers,
    network
  );

  const sig = await genEquipInstallationSignature(9571, 0, 10, 8, 8);
  await realmFacet.unequipInstallation("9571", "0", "10", "8", "8", sig);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  unequipInstallation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
