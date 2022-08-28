import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../constants";

import { AlchemicaFacet, RealmFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

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
    "0x1cCd702118B448021c2E6d716B2517228B88D0A4", //pete
    "0x77d39d12f5698B52F474E8ddf304e0aED83f7Af6", //mark
    "0xa48ca65Ef647F04ef7CEF89CB73C8E53e3736A15", //mauvis
    "0x67c6B18A003424948Eb8aa2B77Bc93F0cbaE7383", //aris
    "0x1d651fC22aCA998A1dFc9Bc273d85a0540A6563a", //jerome
    "0x5633289538Da1E5eCFf7E83bB262bCfef8c0575F", //christian
    "0xaA5150a579e91DFc14a6Af0c2B665B190a03E89f", //coderdan
    "0xe1441881f2fa65Efa686d0a6104A945d6F9E9308", //jesse
  ];

  const onePercent = [59487.11, 30358.3, 26798.18, 8245.73];
  const twoPercent = [118974.22, 60716.6, 53596.36, 16491.46];
  const halfPercent = [29743.555, 15179.15, 13399.09, 4122.865];

  const amountsPayload: BigNumber[][] = [
    onePercent, //pete
    twoPercent, //mark
    onePercent, //mauvis
    onePercent, //aris
    halfPercent, //jerome
    onePercent, //christian
    onePercent, //coderdan
    onePercent, //jesse
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

  for (let i = 0; i < addressPayload.length; i++) {
    const address = addressPayload[i];
    const amounts = amountsPayload[i];

    console.log("Sending:", address, amounts);

    //@ts-ignore
    await realmFacet.batchTransferAlchemica([address], [amounts]);
  }
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
