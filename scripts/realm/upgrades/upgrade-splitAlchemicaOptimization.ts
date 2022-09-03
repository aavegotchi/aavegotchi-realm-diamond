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

  //replacing whole facet to be safe
  const installationFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const tileFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined1 = convertFacetAndSelectorsToString(installationFacets);
  const joined2 = convertFacetAndSelectorsToString(tileFacets);

  const args1: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined1,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  const args2: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.tileDiamond,
    facetsAndAddSelectors: joined2,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  //run upgrades both for tile and installtion diamonds
  // await run("deployUpgrade", args1);
  await run("deployUpgrade", args2);
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
