import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationAdminFacet,
  InstallationAdminFacet__factory,
  InstallationFacet,
  InstallationUpgradeFacet,
} from "../../../typechain";
import { InstallationAdminFacetInterface } from "../../../typechain/InstallationAdminFacet";
import { diamondOwner, impersonate } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function deleteBuggedUpgrades(uint256 _parcelId, uint256 _coordinateX,uint256 _coordinateY,uint256 _installationId, uint256 _upgradeIndex) external`,
      ],
      removeSelectors: [],
    },
  ];

  const c = await varsForNetwork(ethers);

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: InstallationAdminFacetInterface = new ethers.utils.Interface(
    InstallationAdminFacet__factory.abi
  ) as InstallationAdminFacetInterface;

  const parcelId = "24557";

  const calldata = iface.encodeFunctionData("deleteBuggedUpgrades", [
    parcelId,
    "12",
    "30",
    "11",
    "5131",
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: c.installationDiamond,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);

  const installationsUpgradeFacet = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationAdminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const balance = await installationFacet.installationBalancesOfToken(
    c.realmDiamond,
    parcelId
  );

  // console.log("balance:", balance);

  const upgrades = await installationsUpgradeFacet.getUserUpgradeQueueNew(
    "0x42A6C8cF7001bB08D22145Ef8a1E58126b2Ea2c8"
  );

  console.log("upgrades:", upgrades);

  // const adminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   c.installationDiamond,
  //   await ethers.getSigner(await diamondOwner(c.installationDiamond, ethers))
  // )) as InstallationAdminFacet;

  // console.log("Remove upgrade");
  // await adminFacet.deleteBuggedUpgrades(parcelId, "12", "30", "11", "5131");

  // const upgradeQueue: UpgradeQueue = {
  //   coordinateX: 16,
  //   coordinateY: 26,
  //   parcelId: parcelId,
  //   readyBlock: 0,
  //   claimed: false,
  //   owner: "0x42A6C8cF7001bB08D22145Ef8a1E58126b2Ea2c8",
  //   installationId: 10,
  // };

  // const upgradeSig = await genUpgradeInstallationSignature(
  //   parseInt(parcelId),
  //   16,
  //   26,
  //   10
  // );

  // console.log("upgrade installation");
  // await installationsUpgradeFacet.upgradeInstallation(
  //   upgradeQueue,
  //   upgradeSig,
  //   0
  // );

  // let balance = await installationsFacet.installationBalancesOfToken(
  //   maticRealmDiamondAddress,
  //   7958
  // );

  // console.log("balance:", balance);

  // const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  // let adminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   maticInstallationDiamondAddress,
  //   signer
  // )) as InstallationAdminFacet;

  // if (network.name === "hardhat") {
  //   adminFacet = await impersonate(
  //     await diamondOwner(maticInstallationDiamondAddress, ethers),
  //     adminFacet,
  //     ethers,
  //     network
  //   );
  // }

  // //@ts-ignore
  // await adminFacet.fixMissingAltars(buggedAltars, { gasPrice: gasPrice });

  // balance = await installationsFacet.installationBalancesOfToken(
  //   maticRealmDiamondAddress,
  //   7958
  // );

  // console.log("balance:", balance);

  // await adminFacet.finalizeUpgrades(["5408"]);
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

/*
  const graphIds = {
    "1": 59,
    "2": 36,
    "3": 48,
    "4": 18,
    "5": 4,
    "6": 3,
    "7": 2,
    "9": 1,
    "10": 8604,
    "11": 3584,
    "12": 2195,
    "13": 338,
    "14": 22,
    "15": 15,
  };
*/

// const onchainTokens = [
//   "10: 9238",
//   "11: 3781",
//   "1: 69",
//   "2: 40",
//   "12: 2296",
//   "3: 57",
//   "13: 297",
//   "8: 1",
//   "4: 18",
//   "6: 2",
//   "16: 1",
//   "5: 6",
//   "14: 14",
//   "15: 2",
// ];

// tokens: [
//   '10: 9234', '11: 3852',
//   '1: 68',    '2: 42',
//   '12: 2405', '3: 57',
//   '13: 383',  '8: 2',
//   '4: 21',    '6: 3',
//   '16: 1',    '5: 6',
//   '14: 25',   '15: 14',
//   '7: 2',     '9: 1',
//   '17: 1'
// ]
