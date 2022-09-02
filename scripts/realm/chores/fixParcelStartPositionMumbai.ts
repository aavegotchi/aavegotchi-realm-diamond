import { Signer } from "ethers";
import { ethers, run, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { FixParcelStartPositionTaskArgs } from "../../../tasks/fixParcelStartPosition";
import { RealmGridFacet } from "../../../typechain";

//To be used if a user has "wrong startPosition" error

async function main() {
  let currentOwner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  let signer: Signer;

  // deploy DiamondCutFacet

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const c = await varsForNetwork(ethers);
  const realmGridFacet = (await ethers.getContractAt(
    "RealmGridFacet",
    c.realmDiamond,
    signer
  )) as RealmGridFacet;

  const tx = await realmGridFacet.fixGridStartPositions(
    [
      "11106",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
      "10899",
    ],
    [
      3, 0, 2, 0, 2, 0, 6, 8, 10, 12, 14, 14, 12, 12, 14, 6, 8, 10, 12, 14, 0,
      7, 7,
    ],
    [3, 0, 0, 2, 2, 5, 0, 0, 2, 0, 2, 4, 4, 2, 0, 6, 6, 6, 6, 6, 8, 14, 12],
    false,
    [
      10, 102, 102, 102, 102, 9, 101, 12, 11, 66, 65, 83, 120, 65, 66, 8, 8, 10,
      15, 14, 7, 18, 133,
    ]
  );
  await tx.wait();
  console.log("Updated");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
