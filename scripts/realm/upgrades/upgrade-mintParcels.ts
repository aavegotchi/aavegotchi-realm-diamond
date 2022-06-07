import { run, ethers } from "hardhat";
import { maticRealmDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import { diamondOwner } from "../../helperFunctions";
import { mintPaartnerParcels } from "../chores/mintPaartnerParcels";

export async function upgradeRealm() {
  const MintParcelInput = `tuple(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        `function mintParcels(address[] calldata _to,uint256[] calldata _tokenIds, ${MintParcelInput}[] memory _metadata) external`,
      ],
      removeSelectors: [
        `function mintParcels(address _to,uint256[] calldata _tokenIds, ${MintParcelInput}[] memory _metadata) external`,
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(maticRealmDiamondAddress, ethers),
    diamondAddress: maticRealmDiamondAddress,
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
  upgradeRealm()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
