//@ts-ignore
import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { MintParcelsTaskArgs } from "../../../tasks/mintParcels";

export async function mintPaartnerParcels() {
  interface MintParcelArgs {
    to: string;
    tokenId: number;
  }

  const ids = [
    "29426",
    "29627",
    "29814",
    "30011",
    "30202",
    "30360",
    "30558",
    "30750",
    "29285",
    "29457",
    "29655",
    "29836",
    "30035",
    "30220",
    "30391",
    "30591",
    "31428",
    "31246",
    "31041",
    "30844",
    "30669",
    "30458",
    "30275",
    "30113",
    "28761",
    "29007",
    "28539",
    "28767",
    "28376",
    "28585",
    "28203",
    "28413",
    "28264",
    "28116",
    "28323",
    "28526",
    "28015",
    "28231",
    "27897",
    "28142",
    "28492",
    "27892",
    "28291",
    "28069",
    "26902",
    "26250",
    "25789",
    "26461",
    "25361",
  ];

  const to = "";

  const mintArgs: MintParcelArgs[] = ids.map((val) => {
    return {
      to: to,
      tokenId: Number(val),
    };
  });

  const toAddresses = mintArgs.map((val) => val.to).join(",");
  const tokenIds = mintArgs.map((val) => val.tokenId).join(",");

  const vars = await varsForNetwork(ethers);

  const taskArgs: MintParcelsTaskArgs = {
    //Send directly to voucher conversion contract
    toAddresses: toAddresses,
    tokenIds: tokenIds,
    diamondAddress: vars.realmDiamond,
  };

  await run("mintParcels", taskArgs);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  mintPaartnerParcels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
