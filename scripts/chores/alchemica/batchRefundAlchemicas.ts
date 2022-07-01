import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";

import { AlchemicaFacet, RealmFacet } from "../../../typechain";
import { impersonate } from "../../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const c = await varsForNetwork(ethers);
  const maticDiamondAddress = c.realmDiamond;

  let realmFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    maticDiamondAddress,
    deployer
  )) as AlchemicaFacet;

  const addressPayload: string[] = [
    "0x2848b9f2d4faebaa4838c41071684c70688b455d",
    "0x73b46a49e5f92480710b07be849500b772b6a995",
    "0x352ac32c9663fb7caac363f77b121c34d9acb420",
  ];

  const amountsPayload: BigNumber[][] = [
    [150, 75, 37.5, 5],
    [300, 150, 75, 10],
    [900, 450, 224, 30],
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
