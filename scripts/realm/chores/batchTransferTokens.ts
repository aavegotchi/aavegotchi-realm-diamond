//@ts-ignore
import { BigNumber } from "ethers";
import hardhat, { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";

const gasPrice = 100000000000;

async function transferOwner() {
  const accounts = await ethers.getSigners();

  const owner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const c = await varsForNetwork(ethers);

  // const addresses = [
  //   "0xADA8aA2777825bc615C5F12126F8bf275E2245e5",
  //   "0x1A760e3A431c8B9C075eD1280C8835a1a0F1651b",
  //   "0x2D5f86cd294cA6c92189340EaEFf41fc63Dc66EF",
  //   "0x47d6f96ba098816389db7c87cbf077de7181b853",
  //   "0x09a1A849974D021a0F74366E5020884FF73e3aBB",
  //   "0x43FF4C088df0A425d1a519D3030A1a3DFff05CfD",
  //   "0x5D5CC66fc2f3829c399E47F7B71A5be4918a8851",
  //   "0xfdf7fb637a50192bc9016e6156babb3f9004ef9b",
  //   "0x5D5CC66fc2f3829c399E47F7B71A5be4918a8851",
  //   "0x2bD7716Ce2c43B9c0D58982F5BAC67633bf2E7dC",
  //   "0x73B46a49E5f92480710B07Be849500B772b6A995",
  //   "0x7f4e21b39d6506e333b9b470b3fdedd4fcbbc6e8",
  //   "0x2b29518e5ac3eda4CfC138FacD6f023bffc5d65a",
  //   "0xAE1203E44FB525B93dcAb0d45cf7D2F64a78B2BB",
  //   "0x299F70376d88868d26772F152751d25B910d6B33",
  //   "0x579361d2636152df34DB1d6dFD343f5037dDC71D",
  //   "0x6794BDa8e07FAA690d6924B259992Ed354aeC9Bb",
  //   "0x180f207F8747a966EC94277a69610162D7FA3FF1",
  //   "0xA5643D9B4A2049d578a690269Dbc13426b352672",
  //   "0x8628D73d3F950ABDE99739EF34B6CfA10394f579",
  //   "0xE1bCD0f5c6c855ee3452B38E16FeD0b7Cb0CC507",
  //   "0x090E971Ae5d4b8d835f6b158861487caA105e2Fb",
  //   "0xAE1203E44FB525B93dcAb0d45cf7D2F64a78B2BB",
  //   "0xEc112EC8262E67EBFD1744904ED1d6F22CA986CE",
  //   "0xAE1203E44FB525B93dcAb0d45cf7D2F64a78B2BB",
  //   "0xA5643D9B4A2049d578a690269Dbc13426b352672",
  //   "0x579361d2636152df34DB1d6dFD343f5037dDC71D",
  //   "0x2bD7716Ce2c43B9c0D58982F5BAC67633bf2E7dC",
  //   "0x08A534738Ba8Ec107eD65986a3de66c330441b9A",
  //   "0xb9FF017c875F5C39d0018D1dF86FbD92943d5b82",
  //   "0x4db49Fbd996b21551eE86c58E37D9Ffc7650372f",
  //   "0xA5643D9B4A2049d578a690269Dbc13426b352672",
  //   "0x755A89AC371eE91c1E0fC313Bc9efF5Fc150b993",
  //   "0x5aE7aE79765973cA60EE9f9e29866B63952Ae807",
  //   "0x67dA637A5d8db19B16235801e2c768F369D95a0C",
  //   "0xD94A33d2791AE1EEb30e2295276F6b82c17C02cb",
  //   "0x35f87cf2c34137314d133e6b95a8cbd31de82301",
  //   "0x4D00b44569C615f49F50814e4328F354b89E9EFe",
  //   "0xe23DA0Be88c9B56c815C0525E5c1C687A99A8DeF",
  //   "0x180f207F8747a966EC94277a69610162D7FA3FF1",
  //   "0x2b29518e5ac3eda4CfC138FacD6f023bffc5d65a",
  //   "0xCd3014700f40D44F36c520b3bc887b7A603673Dd",
  //   "0xdc7519e753741a07B100f6cA09ba19aFB1E2cb91",
  //   "0x3c2262255793f2b4629F7b9A2D57cE78f7842A8d",
  //   "0x30dCCa068F593CbFFB5afFe8A89F35AE49614972",
  //   "0xCd3014700f40D44F36c520b3bc887b7A603673Dd",
  //   "0x3c2262255793f2b4629F7b9A2D57cE78f7842A8d",
  //   "0x99959f1A3c5464C78bf446Bd1117a3EC44c7684e",
  //   "0x26cf02F892B04aF4Cf350539CE2C77FCF79Ec172",
  //   "0x26cf02F892B04aF4Cf350539CE2C77FCF79Ec172",
  //   "0x74BF5B9972Da24406C2c046494a5cCBE2fBa28Dc",
  //   "0x5b1633Ff5389e71a567A8D190f752DDF6bFcEB72",
  //   "0x6157730C4F8e2092f601460B836530E3252B3120",
  //   "0x2bD7716Ce2c43B9c0D58982F5BAC67633bf2E7dC",
  //   "0x79D87C8BEf0f0620d773983a6bE6DdCa784ca8a9",
  //   "0xe0C74c6AC956dBA68797D76F77F1f5a52258aA7e",
  //   "0xb0C4Cc1AA998DF91D2c27cE06641261707A8c9C3",
  //   "0x8528B14e34d670FBfFA48DfEbE5CCb7208f4276C",
  //   "0x090E971Ae5d4b8d835f6b158861487caA105e2Fb",
  //   "0x6C127b8ff818d1BBbf6015c327FDe5CA73a78a91",
  //   "0x00504A2263bE7a73A7173d82ABA03E29817A6b5e",
  //   "0x180f207F8747a966EC94277a69610162D7FA3FF1",
  //   "0xb2C980A75f76C664B00b18647bBad08e3df0460D",
  //   "0x9F6C47623d23FC9dBCa3eD670a43792DB3aacaeE",
  //   "0xa819C50d511187CE0f6Aa352427586D6d0c187F7",
  //   "0x501ffc7Ee44f7986c24FB5bf7C04c1ED6377ec87",
  //   "0xA5643D9B4A2049d578a690269Dbc13426b352672",
  //   "0xf24f0a86E0b8367Bf065471Bbdc89008f0087Fd3",
  //   "0xCd3014700f40D44F36c520b3bc887b7A603673Dd",
  //   "0x090E971Ae5d4b8d835f6b158861487caA105e2Fb",
  //   "0x26cf02F892B04aF4Cf350539CE2C77FCF79Ec172",
  //   "0x8B208A8F61E6E502cbB28c3F17412B30CE6dfD70",
  //   "0xB222525A29c7f35D826B3832501D5e980498aE63",
  //   "0x6C127b8ff818d1BBbf6015c327FDe5CA73a78a91",
  //   "0x69c83D3c2f99c61973Bb2242FEFFf37a34bAD94c",
  //   "0x8347EB85648d2079604010DDb7649Ce1cEA8C2FC",
  //   "0x00504A2263bE7a73A7173d82ABA03E29817A6b5e",
  //   "0xA5643D9B4A2049d578a690269Dbc13426b352672",
  //   "0xb8B95A513C2F754AE61087edfe0057c80513e649",
  //   "0x4D00b44569C615f49F50814e4328F354b89E9EFe",
  //   "0xa2F5C88B65719EA30846b331B6f949B077543bAC",
  //   "0xF1EA4404203f5688a35EFB5D76b23A87B0975AE1",
  //   "0xb0C4Cc1AA998DF91D2c27cE06641261707A8c9C3",
  //   "0xa322f14c4e9628F5934420a6098a01e7C999e657",
  //   "0x6C127b8ff818d1BBbf6015c327FDe5CA73a78a91",
  //   "0xE7DaCfa93fEe4C6d383aFE7136BAf23C6957F098",
  //   "0xb66Fa16Fa2fF5Fd22804ED2C01f4DD0615586c16",
  //   "0xb66Fa16Fa2fF5Fd22804ED2C01f4DD0615586c16",
  //   "0xCd3014700f40D44F36c520b3bc887b7A603673Dd",
  //   "0xa322f14c4e9628F5934420a6098a01e7C999e657",
  //   "0xb66Fa16Fa2fF5Fd22804ED2C01f4DD0615586c16",
  //   "0x99Ac39F74CC51f683667F08B4591A6bc3639e0C5",
  //   "0x8347EB85648d2079604010DDb7649Ce1cEA8C2FC",
  // ];

  // const amounts = [
  //   "2000",
  //   "750",
  //   "500",
  //   "300",
  //   "200",
  //   "100",
  //   "850",
  //   "100",
  //   "100",
  //   "100",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "550",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "1000",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  //   "50",
  // ];

  // let amountsFinal: BigNumber[][] = [];

  // let tokens = [];
  // addresses.forEach((_, index) => {
  //   tokens.push([c.ghst]);
  //   const amount = amounts[index];
  //   amountsFinal.push([ethers.utils.parseEther(amount)]);
  // });

  // let signer: any;

  // // deploy DiamondCutFacet

  // const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  // if (testing) {
  //   await hardhat.network.provider.request({
  //     method: "hardhat_impersonateAccount",
  //     params: [owner],
  //   });
  //   signer = await ethers.provider.getSigner(owner);
  // } else if (hardhat.network.name === "matic") {
  //   signer = accounts[0];
  // } else {
  //   throw Error("Incorrect network selected");
  // }

  const erc20 = await ethers.getContractAt("ERC20", c.ghst);
  const balance = await erc20.balanceOf(
    "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64",
    { blockTag: 18977000 }
  );
  console.log("bal", ethers.utils.formatEther(balance));

  // console.log("Approving");
  // await erc20.approve(c.realmDiamond, ethers.constants.MaxUint256, {
  //   gasPrice: gasPrice,
  // });

  // //transfer ownership to multisig
  // const alchemicaFacet = await ethers.getContractAt(
  //   "AlchemicaFacet",
  //   c.realmDiamond,
  //   signer
  // );

  // console.log("Transferring tokens");
  // const tx = await alchemicaFacet.batchTransferTokens(
  //   tokens,
  //   amountsFinal,
  //   addresses,
  //   { gasPrice: gasPrice }
  // );

  // await tx.wait();
  // console.log("Tokens transferred successfully!");

  // const afterBalance = await erc20.balanceOf(owner);
  // console.log("bal", ethers.utils.formatEther(afterBalance));
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
