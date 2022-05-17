import { ethers } from "hardhat";
import { BigNumberish } from "@ethersproject/bignumber";

export function alchemicaTotals() {
  const hardcodedAlchemicasTotals: number[][] = [
    [14154, 7076, 3538, 1414],
    [56618, 28308, 14154, 5660],
    [452946, 226472, 113236, 45294],
    [452946, 226472, 113236, 45294],
    [905894, 452946, 226472, 90588],
  ];

  const alchemicaTotalsBN: BigNumberish[][] = [];

  hardcodedAlchemicasTotals.forEach((element) => {
    alchemicaTotalsBN.push(
      element.map((val) => ethers.utils.parseEther(val.toString()))
    );
  });

  return alchemicaTotalsBN;
}

export const boostMultipliers: [
  BigNumberish,
  BigNumberish,
  BigNumberish,
  BigNumberish
] = [
  ethers.utils.parseEther("1000"),
  ethers.utils.parseEther("500"),
  ethers.utils.parseEther("250"),
  ethers.utils.parseEther("100"),
];

export const greatPortalCapacity: [
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

// export async function setAddresses() {
//   const diamondAddress = "0xCDe6B59B6AcBbdBf5D6Ef4c291481feCA70cf1aa";
//   const realmFacet = (await ethers.getContractAt(
//     "RealmFacet",
//     diamondAddress
//   )) as RealmFacet;
//   const alchemicaFacet = (await ethers.getContractAt(
//     "AlchemicaFacet",
//     diamondAddress
//   )) as AlchemicaFacet;

//   // await realmFacet.setAavegotchiDiamond(
//   //   "0x705F32B7D678eE71085ed11ddcba7378367f1582"
//   // );

//   const greatPortalCapacity: [
//     BigNumberish,
//     BigNumberish,
//     BigNumberish,
//     BigNumberish
//   ] = [
//     ethers.utils.parseUnits("1250000000"),
//     ethers.utils.parseUnits("625000000"),
//     ethers.utils.parseUnits("312500000"),
//     ethers.utils.parseUnits("125000000"),
//   ];

//   //Mumbai-specific
//   const vrfCoordinator = "0xb96A95d11cE0B8E3AEdf332c9Df17fC31D379651";
//   const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
//   const installationDiamond = "0x071f9431276F63aaA14b759Bd41143Cb1654AB93";
//   const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

//   await alchemicaFacet.setVars(
//     //@ts-ignore
//     alchemicaTotals(),
//     greatPortalCapacity,
//     installationDiamond,
//     "0xCDe6B59B6AcBbdBf5D6Ef4c291481feCA70cf1aa",
//     vrfCoordinator,
//     linkAddress,
//     [
//       "0x9Fee2dbFceB39103F9cA732A38531BDcd14F7ED7",
//       "0x5a2347fb5dd05c9F05474108B3a77e511D977dBb",
//       "0x7Fe83e7E44cFDA7BBA8abd7F93a11A607470668d",
//       "0x06975058C9701f1626c152f61De8348D5CFdd837",
//     ],
//     ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
//   );
// }

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// if (require.main === module) {
//   setAddresses()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }
