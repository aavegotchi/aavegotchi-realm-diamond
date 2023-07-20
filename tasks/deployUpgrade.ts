// import { sendToMultisig } from "../scripts/libraries/multisig/multisig";
// import { AddressZero } from "@ethersproject/constants";
import { task } from "hardhat/config";
import {
  Contract,
  ContractFactory,
  ContractReceipt,
  ContractTransaction,
  PopulatedTransaction,
} from "@ethersproject/contracts";

import { OwnershipFacet } from "../typechain/OwnershipFacet";
import { IDiamondCut } from "../typechain/IDiamondCut";
import {
  getFunctionNames,
  getSelectors,
  getSighashes,
} from "../scripts/helperFunctions";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { gasPrice } from "../constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export interface FacetsAndAddSelectors {
  facetName: string;
  addSelectors: string[];
  removeSelectors: string[];
}

type FacetCutType = { Add: 0; Replace: 1; Remove: 2 };
const FacetCutAction: FacetCutType = { Add: 0, Replace: 1, Remove: 2 };

export interface DeployUpgradeTaskArgs {
  diamondAddress: string;
  facetsAndAddSelectors: string;
  useMultisig: boolean;
  useLedger: boolean;
  initAddress?: string;
  initCalldata?: string;
  // verifyFacets: boolean;
  // updateDiamondABI: boolean;
}

interface Cut {
  facetAddress: string;
  action: 0 | 1 | 2;
  functionSelectors: string[];
}

export function convertFacetAndSelectorsToString(
  facets: FacetsAndAddSelectors[]
): string {
  let outputString = "";

  facets.forEach((facet) => {
    outputString = outputString.concat(
      `#${facet.facetName}$$$${facet.addSelectors.join(
        "*"
      )}$$$${facet.removeSelectors.join("*")}`
    );
  });

  return outputString;
}

export function convertStringToFacetAndSelectors(
  facets: string
): FacetsAndAddSelectors[] {
  const facetArrays: string[] = facets.split("#").filter((string) => {
    return string.length > 0;
  });

  const output: FacetsAndAddSelectors[] = [];

  facetArrays.forEach((string) => {
    const facetsAndAddSelectors = string.split("$$$");
    output.push({
      facetName: facetsAndAddSelectors[0],
      addSelectors: facetsAndAddSelectors[1].split("*"),
      removeSelectors: facetsAndAddSelectors[2].split("*"),
    });
  });

  return output;
}

task(
  "deployUpgrade",
  "Deploys a Diamond Cut, given an address, facets and addSelectors, and removeSelectors"
)
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam(
    "facetsAndAddSelectors",
    "Stringified array of facet names to upgrade, along with an array of add Selectors"
  )
  .addOptionalParam("initAddress", "The facet address to call init function on")
  .addOptionalParam("initCalldata", "The calldata for init function")
  .addFlag(
    "useMultisig",
    "Set to true if multisig should be used for deploying"
  )
  .addFlag("useLedger", "Set to true if Ledger should be used for signing")
  // .addFlag("verifyFacets","Set to true if facets should be verified after deployment")

  .setAction(
    async (taskArgs: DeployUpgradeTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const facets: string = taskArgs.facetsAndAddSelectors;
      const facetsAndAddSelectors: FacetsAndAddSelectors[] =
        convertStringToFacetAndSelectors(facets);
      const diamondAddress: string = taskArgs.diamondAddress;
      const useMultisig = taskArgs.useMultisig;
      const useLedger = taskArgs.useLedger;
      const initAddress = taskArgs.initAddress;
      const initCalldata = taskArgs.initCalldata;

      const branch = require("git-branch");
      if (hre.network.name === "matic" && branch.sync() !== "master") {
        throw new Error("Not master branch!");
      }

      //Instantiate the Signer
      let signer: SignerWithAddress | LedgerSigner;
      const owner = await (
        (await hre.ethers.getContractAt(
          "OwnershipFacet",
          diamondAddress
        )) as OwnershipFacet
      ).owner();
      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      if (testing) {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [owner],
        });
        signer = await hre.ethers.getSigner(owner);
      } else if (hre.network.name === "mumbai") {
        signer = (await hre.ethers.getSigners())[0];
      } else if (hre.network.name === "matic") {
        if (useLedger) {
          signer = new LedgerSigner(hre.ethers.provider, "m/44'/60'/2'/0/0");
        } else signer = (await hre.ethers.getSigners())[0];
      } else {
        throw Error("Incorrect network selected");
      }

      //Create the cut
      const deployedFacets = [];
      const cut: Cut[] = [];

      for (let index = 0; index < facetsAndAddSelectors.length; index++) {
        const facet = facetsAndAddSelectors[index];

        if (hre.network.name === "matic" && facet.facetName.includes("Test")) {
          throw new Error("STOPPPP");
        }

        console.log("facet:", facet);
        const factory = (await hre.ethers.getContractFactory(
          facet.facetName
        )) as ContractFactory;
        const deployedFacet: Contract = await factory.deploy({
          gasPrice: gasPrice,
        });
        await deployedFacet.deployed();
        console.log(
          `Deployed Facet Address for ${facet.facetName}:`,
          deployedFacet.address
        );
        deployedFacets.push(deployedFacet);

        const newSelectors = getSighashes(facet.addSelectors, hre.ethers);
        const removeSelectors = getSighashes(facet.removeSelectors, hre.ethers);

        //debug
        let existingFuncs = getSelectors(deployedFacet);
        let existingFuncNames = getFunctionNames(deployedFacet);

        existingFuncs.forEach((el, index) => {
          console.log("debug:", el, existingFuncNames[index]);
        });

        for (const selector of newSelectors) {
          const index = newSelectors.findIndex((val) => val == selector);
          console.log(
            `selector: ${selector}, function: ${facet.addSelectors[index]}`
          );

          if (!existingFuncs.includes(selector)) {
            throw Error(
              `Selector ${selector} (${facet.addSelectors[index]}) not found`
            );
          }
        }

        let existingSelectors = getSelectors(deployedFacet);
        existingSelectors = existingSelectors.filter(
          (selector) => !newSelectors.includes(selector)
        );

        if (newSelectors.length > 0) {
          cut.push({
            facetAddress: deployedFacet.address,
            action: FacetCutAction.Add,
            functionSelectors: newSelectors,
          });
        }

        //Always replace the existing selectors to prevent duplications
        if (existingSelectors.length > 0)
          cut.push({
            facetAddress: deployedFacet.address,
            action: FacetCutAction.Replace,
            functionSelectors: existingSelectors,
          });

        if (removeSelectors.length > 0) {
          console.log("Removing selectors:", removeSelectors);
          cut.push({
            facetAddress: hre.ethers.constants.AddressZero,
            action: FacetCutAction.Remove,
            functionSelectors: removeSelectors,
          });
        }
      }

      console.log(cut);

      //Execute the Cut
      const diamondCut = (await hre.ethers.getContractAt(
        "IDiamondCut",
        diamondAddress,
        signer
      )) as IDiamondCut;

      if (testing) {
        console.log("Diamond cut");
        const tx: ContractTransaction = await diamondCut.diamondCut(
          cut,
          initAddress ? initAddress : hre.ethers.constants.AddressZero,
          initCalldata ? initCalldata : "0x",
          { gasPrice: gasPrice }
        );
        console.log("Diamond cut tx:", tx.hash);
        const receipt: ContractReceipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Diamond upgrade failed: ${tx.hash}`);
        }
        console.log("Completed diamond cut: ", tx.hash);
      } else {
        //Choose to use a multisig or a simple deploy address
        if (useMultisig) {
          console.log("Sending Diamond cut to Multisig");
          const tx: PopulatedTransaction =
            await diamondCut.populateTransaction.diamondCut(
              cut,
              initAddress ? initAddress : hre.ethers.constants.AddressZero,
              initCalldata ? initCalldata : "0x",
              { gasLimit: 800000 }
            );
          // await sendToMultisig(diamondUpgrader, signer, tx, hre.ethers);
        } else {
          console.log("Sending upgrade to Ledger...");
          const tx: ContractTransaction = await diamondCut.diamondCut(
            cut,
            initAddress ? initAddress : hre.ethers.constants.AddressZero,
            initCalldata ? initCalldata : "0x",
            { gasPrice: gasPrice }
          );

          const receipt: ContractReceipt = await tx.wait();
          if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${tx.hash}`);
          }
          console.log("Completed diamond cut: ", tx.hash);
        }
      }
    }
  );
