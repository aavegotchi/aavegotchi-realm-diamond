import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { RealmFacet__factory } from "../../typechain";
import { RealmFacetInterface } from "../../typechain/RealmFacet";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function setVars(address _aavegotchiDiamond, address[4] calldata _alchemicaAddresses) external",
        "function batchTransferTokensToGotchis(uint256[] calldata _gotchiIds, address[] calldata _tokenAddresses, uint256[][] calldata _amounts) external",
        "function batchTransferAlchemica(address[] calldata _targets, uint256[4][] calldata _amounts) external",
      ],
      removeSelectors: [
        "function setAavegotchiDiamond(address _diamondAddress) external",
        "function addERC721Interface() external",
      ],
    },
  ];

  let iface: RealmFacetInterface = new ethers.utils.Interface(
    RealmFacet__factory.abi
  ) as RealmFacetInterface;

  const fud = "0x0000000000000000000000000000000000000000";
  const fomo = "0x0000000000000000000000000000000000000000";
  const alpha = "0x0000000000000000000000000000000000000000";
  const kek = "0x0000000000000000000000000000000000000000";

  const maticAavegotchiDiamond = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const calldata = iface.encodeFunctionData("setVars", [
    maticAavegotchiDiamond,
    [fud, fomo, alpha, kek],
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
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
