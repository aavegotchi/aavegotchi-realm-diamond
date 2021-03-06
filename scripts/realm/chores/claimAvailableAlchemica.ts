import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { AlchemicaFacet, VRFFacet } from "../../../typechain";
import { impersonate } from "../../helperFunctions";
import { genChannelAlchemicaSignature } from "../realmHelpers";

export async function setAddresses() {
  const c = await varsForNetwork(ethers);

  console.log("c:", c);

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond
  )) as AlchemicaFacet;

  alchemicaFacet = await impersonate(
    "0x94cb5C277FCC64C274Bd30847f0821077B231022",
    alchemicaFacet,
    ethers,
    network
  );

  const sig = await genChannelAlchemicaSignature(143, 0, 0);

  const tx = await alchemicaFacet.claimAvailableAlchemica("143", "0", sig);
  await tx.wait();

  // console.log("subscribe");
  // const subTx = await vrfFacet.subscribe({
  //   gasPrice: 500000000000,
  // });

  // await subTx.wait();

  // console.log("topup");
  // const topTx = await vrfFacet.topUpSubscription(
  //   ethers.utils.parseUnits("0.1"),
  //   {
  //     gasPrice: 500000000000,
  //   }
  // );

  // await topTx.wait();
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
