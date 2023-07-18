import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { TileFacet__factory } from "../../../typechain-types";

const gotchichainBridgeAddress = "0xB8133C7CF766f29d68b0cC470ED8F0B65eB996E6";

export async function upgrade(bridgeAddress: string) {

  const tuple = `tuple(uint8 width, uint8 height, bool deprecated, uint16 tileType, uint32 craftTime, uint256[4] alchemicaCost, string name)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        `function setLayerZeroBridgeAddress(address _newLayerZeroBridge) external`,
        `function editDeprecateTime(uint256[] calldata _typeIds, uint40[] calldata _deprecateTimes) external`,
        `function editTileTypes(uint256[] calldata _typeIds, ${tuple}[] calldata _updatedTiles) external`
      ],
      removeSelectors: [],
    },
    {
      facetName: "TilesPolygonXGotchichainBridgeFacet",
      addSelectors: [
        `function removeItemsFromOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external`,
        `function addItemsToOwner(address _owner, uint256[] calldata _tokenIds, uint256[] calldata _tokenAmounts) external`
      ],
      removeSelectors: [],
    },
  ];

  let iface = new ethers.utils.Interface(
    TileFacet__factory.abi
  );

  const calldata = iface.encodeFunctionData("setLayerZeroBridgeAddress", [
    bridgeAddress,
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const addrs = await varsForNetwork(ethers)

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: addrs.tileDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: addrs.tileDiamond,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgrade(gotchichainBridgeAddress)
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
