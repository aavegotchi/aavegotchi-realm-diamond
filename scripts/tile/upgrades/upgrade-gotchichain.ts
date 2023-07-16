import { run, ethers } from "hardhat";
import { maticTileDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  TileFacet__factory,
} from "../../../typechain";

const gotchichainBridgeAddress = "0xe6517944BbA81e86Bf619DF6D5b549348Bb70446";


export async function upgrade(bridgeAddress: string) {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        `function setLayerZeroBridgeAddress(address _newLayerZeroBridge) external`,
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

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticTileDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticTileDiamondAddress,
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
