import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { maticTileDiamondAddress } from "../../../constants";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        "function tileBalancesOfToken(address _tokenContract, uint256 _tokenId) public view",
        "function tileBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId) external view",
        "function equipTile(address _owner,uint256 _realmId,uint256 _tileId) external",
        "function unequipTile(address _owner,uint256 _realmId,uint256 _tileId) external",
        "function tileBalancesOfTokenByIds(address _tokenContract, uint256 _tokenId, uint256[] calldata _ids) external view",
        "function reduceCraftTime(uint256[] calldata _queueIds, uint40[] calldata _amounts) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticTileDiamondAddress,
    facetsAndAddSelectors: joined,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
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
