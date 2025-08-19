//@ts-ignore
import hardhat, { ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { getOwner } from "./getInstallationAndTileData";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { gasPrice } from "../helperFunctions";

async function toggleGameManager() {
  const accounts = await ethers.getSigners();

  const c = await varsForNetwork(ethers);

  const currentOwner = await getOwner(c.installationDiamond);
  let signer: any;

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (hardhat.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  //transfer ownership to multisig
  const ownershipFacet = await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  );

  const tx = await ownershipFacet.toggleGameManager(
    "0x8D46fd7160940d89dA026D59B2e819208E714E82",
    true,
    { gasPrice: gasPrice }
  );
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  toggleGameManager()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
