//@ts-ignore
import { run } from "hardhat";
import { MintParcelsTaskArgs } from "../../../tasks/mintParcels";
import { maticDiamondAddress } from "../../../constants";

export async function mintParcels() {
  interface MintParcelArgs {
    to: string;
    tokenId: number;
  }

  const mintArgs: MintParcelArgs[] = [
    {
      to: "0x277D7bb39258698f716b3270692741df950e3df2", // YGG SEA
      tokenId: 40689,
    },
    {
      to: "0x6021DB23296793f8D1e9CdF710b29356DAD1f4A5", // CGU
      tokenId: 13592,
    },
    {
      to: "0xBf30D1A29d191C717E5D52A19dd572Fd078336F1", // Neon DAO
      tokenId: 3609,
    },
    {
      to: "0xb9d72519f9F9ec41a657C57c5A59a32737Ae6636", // Blackpool
      tokenId: 1235,
    },
    {
      to: "0xF0103243F4d22B5696588646b21313d85916A16A", // YGG
      tokenId: 487,
    },
    {
      to: "0xcA04E939A0Ac0626C4a4299735e353E8DC5eF3eC", // Flamingo
      tokenId: 5079,
    },
    {
      to: "0xc46d3c9d93febdd5027c9b696fe576dc654c66de", // OrdenGG
      tokenId: 3682,
    },
    {
      to: "0xBFa9666D681FbBdD2ae8A892dC700ed2F5C15039", // ReadyPlayerDAO
      tokenId: 23881,
    },
    {
      to: "0xc68c8452be34032ab999787796ae0faaf071e054", // MetaGuild
      tokenId: 25029,
    },
  ];

  for (let index = 0; index < mintArgs.length; index++) {
    const taskArgs: MintParcelsTaskArgs = {
      //Send directly to voucher conversion contract
      toAddress: mintArgs[index].to,
      tokenIds: mintArgs[index].tokenId.toString(),
      diamondAddress: maticDiamondAddress,
    };
    await run("mintParcels", taskArgs);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  mintParcels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
