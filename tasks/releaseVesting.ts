// /* global ethers hre task */

// import { BigNumber, Signer } from "ethers";
// import { task } from "hardhat/config";
// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { impersonate } from "../scripts/helperFunctions";
// import { AlchemicaToken, AlchemicaVesting } from "../typechain";
// import { NonceManager } from "@ethersproject/experimental";
// import { alchemica, gasPrice } from "../constants";

// export interface MintParcelsTaskArgs {
//   amounts: string;
//   address: string;
// }

// task(
//   "releaseVesting",
//   "Releases funds from gameplay vesting contract to beneficiary"
// )
//   .addParam("address", "address of the vesting contract")
//   .addParam(
//     "amounts",
//     "amounts of Alchemica to be released (fud, fomo, alpha, kek"
//   )

//   .setAction(
//     async (taskArgs: MintParcelsTaskArgs, hre: HardhatRuntimeEnvironment) => {
//       const amounts = taskArgs.amounts.split(",");

//       console.log("amounts:", amounts);

//       const accounts: Signer[] = await hre.ethers.getSigners();
//       const deployer = accounts[0];
//       const address = taskArgs.address;

//       const manager = new NonceManager(deployer);

//       let ecosystemVestingContract = (await hre.ethers.getContractAt(
//         "AlchemicaVesting",
//         address,
//         manager
//       )) as AlchemicaVesting;

//       if (hre.network.name === "hardhat") {
//         ecosystemVestingContract = await impersonate(
//           "0x94cb5C277FCC64C274Bd30847f0821077B231022",
//           ecosystemVestingContract,
//           hre.ethers,
//           hre.network
//         );
//       }

//       const beneficiary = await ecosystemVestingContract.beneficiary();
//       console.log("beneficiary is:", beneficiary);

//       const tx = await ecosystemVestingContract.batchPartialRelease(
//         alchemica,
//         amounts,
//         { gasPrice: gasPrice }
//       );
//       await tx.wait();

//       for (let i = 0; i < alchemica.length; i++) {
//         const element = alchemica[i];

//         let releasableamount = await ecosystemVestingContract.releasableAmount(
//           element
//         );

//         console.log(
//           "Remaining releasable amount:",
//           hre.ethers.utils.formatEther(releasableamount)
//         );

//         const token = (await hre.ethers.getContractAt(
//           "AlchemicaToken",
//           element
//         )) as AlchemicaToken;
//         const bal = await token.balanceOf(beneficiary);
//         console.log(
//           "Beneficiary balance is now:",
//           hre.ethers.utils.formatEther(bal)
//         );
//       }
//     }
//   );
