import { Signer } from "ethers";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";
import { AlchemicaFacet, VRFFacet, OwnershipFacet } from "../../../typechain";
import { gasPrice } from "../../helperFunctions";
import { alchemicaTotals, boostMultipliers } from "../../setVars";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const diamondAddress = "0x6bb645178AEd185980e9a9BAB92aA96eB405D7A4";
  const installationDiamond = "0xbFFF3364Cd77Bf69048244b535F3435ff69e63DB";
  const tileDiamond = "0x1C776B6b7372e47C8aC79BC83ce30949cc547C96";
  const vrfCoordinator = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  const fud = "0x75482FcFDF88df0A1c7Afc66411d27db2388C4b5";
  const fomo = "0xf9b19fe41Ab12A7Ab858D4b83212FbC51C970c13";
  const alpha = "0xCA9a214788DD68BB2468794073A24003C975DDbD";
  const kek = "0x3d8D786edE779113938e75BD44B5c8d02Ab0Cf28";

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    diamondAddress
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
  const backendSigner = new ethers.Wallet(process.env.REALM_PK);

  console.log("Setting vars");
  let tx = await alchemicaFacet.setVars(
    //@ts-ignore
    alchemicaTotals(),
    boostMultipliers,
    greatPortalCapacity,
    installationDiamond,
    vrfCoordinator,
    linkAddress,
    [fud, fomo, alpha, kek],
    fud,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
    owner,
    tileDiamond,
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
