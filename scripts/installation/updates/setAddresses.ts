import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network } from "hardhat";
import {
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
  maticTileDiamondAddress,
} from "../../../constants";
import { GLTR_ADDRESS } from "../../../helpers/constants";

import { InstallationAdminFacet, OwnershipFacet } from "../../../typechain";

import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
} from "../../helperFunctions";
import { gasPrice } from "../helperFunctions";

export async function setAddresses() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.PROD_PK);

  const testing = ["hardhat"].includes(network.name);

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    maticInstallationDiamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  // let installationAdminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   maticInstallationDiamondAddress,
  //   signer
  // )) as InstallationAdminFacet;

  // if (testing)
  //   installationAdminFacet = await impersonate(
  //     owner,
  //     installationAdminFacet,
  //     ethers,
  //     network
  //   );

  const newPixelcraftAddress = "0xcfD39603A5059F966cA490bEB3002a7a57A63233";

  // const tx = await installationAdminFacet.setAddresses(
  //   maticAavegotchiDiamondAddress,
  //   maticRealmDiamondAddress,
  //   GLTR_ADDRESS,
  //   newPixelcraftAddress, //update
  //   aavegotchiDAOAddress,
  //   ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
  //   { gasPrice: gasPrice }
  // );
  // await tx.wait();
  console.log("Installation Addresses set!");

  let tileFacet = await ethers.getContractAt(
    "TileFacet",
    maticTileDiamondAddress,
    signer
  );

  if (testing) tileFacet = await impersonate(owner, tileFacet, ethers, network);

  console.log("set tileDiamond addresses");
  const setTileAddressesTx = await tileFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    maticRealmDiamondAddress,
    GLTR_ADDRESS,
    newPixelcraftAddress,
    aavegotchiDAOAddress,
    { gasPrice: gasPrice }
  );
  await setTileAddressesTx.wait();

  console.log("Tile addresses set");
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
