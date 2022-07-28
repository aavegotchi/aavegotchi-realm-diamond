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

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TestRealmFacet",
      addSelectors: [
        `function mockEquipInstallation(uint256 _realmId, uint256 _gotchiId, uint256 _installationId, uint256 _x, uint256 _y) external`,
        `function mockUnequipInstallation(uint256 _realmId, uint256 _gotchiId, uint256 _installationId, uint256 _x, uint256 _y) external`,
        `function mockStartSurveying(uint256 _realmId) external`,
        `function mockRawFulfillRandomWords(uint256 tokenId, uint256 surveyingRound, uint256 seed) external`,
        `function mockClaimAvailableAlchemica(uint256 _realmId, uint256 _gotchiId) external`,
        `function mockMintParcels(address[] calldata _to, uint256[] calldata _tokenIds, ${MintParcelInput}[] memory _metadata) external`,
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
