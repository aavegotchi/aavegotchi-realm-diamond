import { run, ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationUpgradeFacet,
  OwnershipFacet,
  RealmFacet,
} from "../../../typechain";
import { UpgradeQueue } from "../../../types";
import {
  genEquipInstallationSignature,
  genReduceUpgradeSignature,
  genUpgradeInstallationSignature,
} from "../../realm/realmHelpers";
import { impersonate } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        `function reduceUpgradeTime(uint256 _upgradeIndex,uint40 _blocks,bytes memory _signature) external`,
      ],
      removeSelectors: [],
    },
  ];

  const c = await varsForNetwork(ethers);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args); //upgrades to installation diamond

  //setup upgrade
  const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let installationUpgradeFacet = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;
  installationUpgradeFacet = await impersonate(
    owner,
    installationUpgradeFacet,
    ethers,
    network
  );

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    c.realmDiamond
  )) as RealmFacet;
  realmFacet = await impersonate(owner, realmFacet, ethers, network);

  const sig = await genUpgradeInstallationSignature(190, 0, 0, 11);
  const upgradeQueue: UpgradeQueue = {
    parcelId: "190",
    coordinateX: 0,
    coordinateY: 0,
    installationId: 11,
    readyBlock: 0,
    claimed: false,
    owner: owner,
  };
  await installationUpgradeFacet.upgradeInstallation(upgradeQueue, sig, 0);
  //reduce time

  let pending = await installationUpgradeFacet.getParcelUpgradeQueue(190);
  console.log("pending:", pending);

  const beforeReadyBlock = pending.output_[0].readyBlock;
  console.log("before rdy  block:", beforeReadyBlock.toString());
  const upgradeIndex = pending.indexes_[0];
  console.log("index:", upgradeIndex.toString());

  //upgrade should finalize
  const reduceSig = await genReduceUpgradeSignature(upgradeIndex.toNumber());
  await installationUpgradeFacet.reduceUpgradeTime(upgradeIndex, 10, reduceSig);

  pending = await installationUpgradeFacet.getParcelUpgradeQueue(190);
  console.log("pending:", pending);

  const afterReadyBlock = pending.output_[0].readyBlock;
  console.log("after rdy  block:", afterReadyBlock.toString());

  const diff = beforeReadyBlock - afterReadyBlock;

  console.log("Diff should be 10:", diff);

  await installationUpgradeFacet.reduceUpgradeTime(
    upgradeIndex,
    160000, //altar lvl 3
    reduceSig
  );

  pending = await installationUpgradeFacet.getParcelUpgradeQueue(190);
  console.log("pending:", pending);

  const altarLevel = await realmFacet.getAltarId(190);
  console.log("altar level:", altarLevel.toString());
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
