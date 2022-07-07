import { Signer } from "ethers";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";
import { AlchemicaFacet, VRFFacet, OwnershipFacet } from "../../../typechain";
import { gasPrice } from "../../helperFunctions";
import { alchemicaTotals, boostMultipliers } from "../../setVars";
import { varsForNetwork } from "../../../constants";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const c = await varsForNetwork(ethers);

  const vrfCoordinator = "0x7a1bac17ccc5b313516c5e16fb24f7659aa5ebed";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    c.realmDiamond
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond
  )) as AlchemicaFacet;

  const greatPortalCapacity: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [
    ethers.utils.parseUnits("1250000000"),
    ethers.utils.parseUnits("625000000"),
    ethers.utils.parseUnits("312500000"),
    ethers.utils.parseUnits("125000000"),
  ];

  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.MUMBAI_REALM_PK);

  console.log("Setting vars");
  let tx = await alchemicaFacet.setVars(
    //@ts-ignore
    alchemicaTotals(),
    boostMultipliers,
    greatPortalCapacity,
    c.installationDiamond,
    vrfCoordinator,
    linkAddress,
    [c.fud, c.fomo, c.alpha, c.kek],
    c.gltr,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
    owner,
    c.tileDiamond,
    c.aavegotchiDiamond,
    { gasPrice: gasPrice }
  );
  await tx.wait();
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
