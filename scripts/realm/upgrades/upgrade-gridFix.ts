import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { RealmGridFacet, RealmFacet } from "../../../typechain";

export async function harvesterUpgrade() {
  const c = await varsForNetwork(ethers);

  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const signer = await ethers.getSigner(diamondUpgrader);

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const realmFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function fixGrid(uint256 _realmId, uint256 _installationId, uint256[] memory _x, uint256[] memory _y, bool tile) external",
      ],
      removeSelectors: [],
    },
  ];

  const realmJoined = convertFacetAndSelectorsToString(realmFacets);

  console.log("realm diamond:", c.realmDiamond);

  const realmArgs: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: realmJoined,
    useLedger: true,
    useMultisig: false,
    initCalldata: "0x",
    initAddress: ethers.constants.AddressZero,
  };

  await run("deployUpgrade", realmArgs);

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
  let tx = await realmFacet.fixGrid(49205, 0, [7, 7], [7, 8], false);
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
