/* global ethers hre */

import { ethers } from "hardhat";
import { RealmsBridgeGotchichainSide } from "../../typechain-types";

const lzChainIdPolygon = process.env.LZ_CHAIN_ID_POLYGON as string
const realmsBridgeAddressMumbai = process.env.REALMS_BRIDGE_ADDRESS_POLYGON as string
const realmsBridgeAddressGotchichain = process.env.REALMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "0"
}

export default async function main() {
  const realmsBridgeGotchichainSide: RealmsBridgeGotchichainSide = await ethers.getContractAt("RealmsBridgeGotchichainSide", realmsBridgeAddressGotchichain)
  
  const failedTxReceipt = await ethers.provider.getTransactionReceipt("0xf77700f7dfa0f1026d668e65d215cf6fe0b294f483a333126b73e4630923a056")
  const { _nonce, _payload } = realmsBridgeGotchichainSide.interface.decodeEventLog("MessageFailed", failedTxReceipt.logs[1].data)
  
  const trustedRemote = ethers.utils.solidityPack(
    ['address', 'address'],
    [realmsBridgeAddressMumbai, realmsBridgeAddressGotchichain]
  )

  console.log('Failed messages')
  console.log(await realmsBridgeGotchichainSide.failedMessages(lzChainIdPolygon, trustedRemote, _nonce))

  console.log('\nRetrying message')
  const tx = await realmsBridgeGotchichainSide.retryMessage(lzChainIdPolygon, trustedRemote, _nonce, _payload, txParams);
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  const receipt = await tx.wait()

  console.log("Message retried");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;
