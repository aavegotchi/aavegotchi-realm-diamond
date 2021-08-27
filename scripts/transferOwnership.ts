//@ts-ignore
import hardhat, { run, ethers } from "hardhat";

const gasPrice = 20000000000;

async function transferOwner() {
  const accounts = await ethers.getSigners();

  const diamondAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
  let currentOwner = "";
  let signer: any;

  // deploy DiamondCutFacet

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (hardhat.network.name === "matic") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  //transfer ownership to multisig
  const ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress,
    signer
  );

  currentOwner = await ownershipFacet.owner();
  console.log("new owner:", currentOwner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  transferOwner()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployDiamond = transferOwner;
