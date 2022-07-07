import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { VRFFacet__factory } from "../../../typechain";
import { VRFFacetInterface } from "../../../typechain/VRFFacet";
import { upgradeDiamondCut } from "./upgrade-diamond";

export interface VrfConfig {
  subId: number;
  callbackGasLimit: number;
  requestConfirmations: number;
  numWords: number;
  keyHash: string;
}

export async function harvesterUpgrade() {
  const c = await varsForNetwork(ethers);

  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // {
    //   facetName: "AlchemicaFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // {
    //   facetName: "VRFFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: VRFFacetInterface = new ethers.utils.Interface(
    VRFFacet__factory.abi
  ) as VRFFacetInterface;

  let vrfCoordinator: string;
  let vrfConfig: VrfConfig = {
    subId: 0,
    callbackGasLimit: 0,
    requestConfirmations: 0,
    numWords: 0,
    keyHash: "",
  };

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initCalldata: "0x",
    initAddress: ethers.constants.AddressZero,
  };

  await run("deployUpgrade", args);
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
