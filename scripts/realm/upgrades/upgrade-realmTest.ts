import { run, ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { AlchemicaFacet, RealmFacet } from "../../../typechain";
import { impersonate } from "../../helperFunctions";
import {
  genClaimAlchemicaSignature,
  genEquipInstallationSignature,
} from "../realmHelpers";

export async function upgradeRealm() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const c = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    c.realmDiamond
  )) as RealmFacet;
  realmFacet = await impersonate(
    "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5",
    realmFacet,
    ethers,
    network
  );

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond
  )) as AlchemicaFacet;
  alchemicaFacet = await impersonate(
    "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5",
    alchemicaFacet,
    ethers,
    network
  );

  //harvester
  let signature = await genEquipInstallationSignature(190, 0, 56, 4, 0);
  await realmFacet.unequipInstallation("190", "0", "56", "4", "0", signature);

  const lastClaimed = await alchemicaFacet.lastClaimedAlchemica("190");
  const sig = await genClaimAlchemicaSignature(190, 0, lastClaimed);
  await alchemicaFacet.claimAvailableAlchemica("190", "0", sig);

  //reservoir
  signature = await genEquipInstallationSignature(190, 0, 92, 2, 0);
  await realmFacet.unequipInstallation("190", "0", "92", "2", "0", signature);

  //altar
  signature = await genEquipInstallationSignature(190, 0, 11, 0, 0);
  await realmFacet.unequipInstallation("190", "0", "11", "0", "0", signature);
}

if (require.main === module) {
  upgradeRealm()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
