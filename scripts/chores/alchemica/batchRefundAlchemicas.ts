import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { maticDiamondAddress } from "../../../constants";

import { RealmFacet } from "../../../typechain";
import { impersonate } from "../../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticDiamondAddress,
    deployer
  )) as RealmFacet;

  const addressPayload: string[] = [
    "0xccc959bbd2c8f1b0a8f32f3976d9bb78848206b0",
    "0x0a62b995486764b911c25474d0f96d25f4b81500",
    "0x5e0cb2d27431a8f411a48cd4d6b1532cbfaf1612",
    "0xa204e00c8ae770b474d29eadb8591daec85feb49",
    "0x366d31258f2987e90f64a1dd56b90a7e7c7df027",
  ];

  const amountsPayload: BigNumber[][] = [
    [2, 1.5, 0, 0.2],
    [1.5, 0.5, 0.3, 0.3],
    [58.5, 25, 11.4, 3.2],
    [2, 1.1, 45.4, 1.8],
    [3.2, 0.6, 27.4, 0.7],
  ].map((vals) => vals.map((val) => ethers.utils.parseEther(val.toString())));

  console.log("amts:", amountsPayload);

  // const amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
  //   ethers.utils.parseEther("50"),
  //   ethers.utils.parseEther("50"),
  //   ethers.utils.parseEther("50"),
  //   ethers.utils.parseEther("50"),
  // ];

  const owner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const testing = ["hardhat"].includes(network.name);

  if (testing) {
    realmFacet = await impersonate(owner, realmFacet, ethers, network);
  }

  // const alchemicaPayload: [
  //   BigNumberish,
  //   BigNumberish,
  //   BigNumberish,
  //   BigNumberish
  // ][] = [];

  // addressPayload.forEach((address) => {
  //   //@ts-ignore
  //   alchemicaPayload.push(amounts);
  // });

  console.log("Batch transferring!");
  //transfer
  //@ts-ignore
  await realmFacet.batchTransferAlchemica(addressPayload, amountsPayload);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
