import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";

import { AlchemicaToken, RealmFacet } from "../../../typechain";
import {
  alchemica,
  impersonate,
  maticDiamondAddress,
} from "../../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticDiamondAddress,
    deployer
  )) as RealmFacet;

  const addressPayload: string[] = [
    "0xCa8DD95F9fBc083D6566EC141d3a76d94aC2C7c6",
    "0xE12637aF9F355f8328E34776D8a656162c18b2a7",
    "0x6bC3D34e1E5979D396F1C835dd5c9CdBC461Bdd6",
    "0x26548dBe21b8E960e7178868eB94068A4B4FA8b8",
    "0xf2B3696Cc3a7B1C1BDEEF89D811552F88B703A69",
    "0x78122B02940683b2218F88c1624f4a0997700cD3",
    "0x43a27d07392af4099953fd88466C94cB7D08D51c",
    "0x6A6d42e342ce7b1aA368CA2f5E919043715F023F",
  ];

  const amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
    ethers.utils.parseEther("50"),
    ethers.utils.parseEther("50"),
    ethers.utils.parseEther("50"),
    ethers.utils.parseEther("50"),
  ];

  const owner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const testing = ["hardhat"].includes(network.name);

  if (testing) {
    realmFacet = await impersonate(owner, realmFacet, ethers, network);
  }

  const alchemicaPayload: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ][] = [];

  addressPayload.forEach((address) => {
    alchemicaPayload.push(amounts);
  });

  console.log("Batch transferring!");
  //transfer
  await realmFacet.batchTransferAlchemica(addressPayload, alchemicaPayload);
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
