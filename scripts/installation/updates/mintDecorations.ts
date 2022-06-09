import { ethers, network } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import { decorations1 } from "../../../data/installations/decorations1";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";

export async function addDecorations() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
    signer
  )) as InstallationAdminFacet;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    installationAdminFacet = await impersonate(
      await diamondOwner(maticInstallationDiamondAddress, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  const receiveAddress = "0x8d46fd7160940d89da026d59b2e819208e714e82";

  console.log("Minting installation types to !", receiveAddress);

  const amounts = decorations1.map((val) => {
    if (val.name.includes("Godlike")) return 5;
    else if (val.name.includes("Mythical")) return 50;
    else if (val.name.includes("Legendary")) return 100;
    else if (val.name.includes("Rare")) return 250;
    else if (val.name.includes("Uncommon")) return 500;
    else if (val.name.includes("Common")) return 1000;
  });

  const ids = decorations1.map((val) => val.id);

  console.log("amounts:", amounts.length);
  console.log("ids:", ids.length);

  let tx = await installationAdminFacet.mintInstallations(
    ids,
    amounts,
    receiveAddress,
    {
      gasPrice: gasPrice,
    }
  );
  console.log("hash:", tx.hash);
  await tx.wait();
  console.log("Added!");

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;

  const insts = await installationfacet.installationsBalances(receiveAddress);
  console.log("insts:", insts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addDecorations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
