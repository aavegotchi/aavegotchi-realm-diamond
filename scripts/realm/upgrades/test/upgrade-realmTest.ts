import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

import { diamondOwner } from "../../../helperFunctions";
import { mintPaartnerParcels } from "../../chores/mintPaartnerParcels";

export async function upgradeRealmTest() {
  const MintParcelInput = `tuple(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)`;
  const BatchEquip = `tuple(uint256[] types, bool[] equip, uint256[] ids, uint256[] x, uint256[] y)`;

  const facets: FacetsAndAddSelectors[] = [
    // {
    //   facetName: "TestRealmFacet",
    //   addSelectors: [
    //     `function mockBatchEquip(uint256 _realmId,${BatchEquip} memory _equipParams) external`,
    //     `function mockEquipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y) public`,
    //     `function mockUnequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y) public`,
    //     `function mockEquipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y) public`,
    //     `function mockUnequipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y) public`,
    //     `function mockStartSurveying(uint256 _realmId) external`,
    //     `function mockRawFulfillRandomWords(uint256 tokenId, uint256 surveyingRound, uint256 seed) external`,
    //     `function mockClaimAvailableAlchemica(uint256 _realmId, uint256 _gotchiId) external`,
    //     `function mockMintParcels(address[] calldata _to, uint256[] calldata _tokenIds, ${MintParcelInput}[] memory _metadata) external`,
    //   ],
    //   removeSelectors: [],
    // },
    {
      facetName: "RealmFacet",
      addSelectors: [
        `function batchEquip(uint256 _realmId,uint256 _gotchiId,${BatchEquip} memory _params,bytes[] memory _signatures) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.realmDiamond, ethers),
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);

  // await mintPaartnerParcels();
}

if (require.main === module) {
  upgradeRealmTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
