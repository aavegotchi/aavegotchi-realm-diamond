import * as hre from "hardhat";
import { ethers, upgrades } from "hardhat";
import { BigNumber, Signer } from "ethers";

import { address } from "../../helpers/utils";
import { REALM_DIAMOND } from "../../helpers/constants";
import { AlchemicaVesting, ProxyAdmin } from "../../typechain";
import {
  PROXY_ADMIN_ADDRESS,
  ECOSYSTEM_VESTING_ADDRESS,
  GAMEPLAY_VESTING_ADDRESS,
} from "../../helpers/constants";

async function main() {
  const Vesting = await ethers.getContractFactory("AlchemicaVesting");

  // Set up signer and proxy admin
  const signers: Signer[] = await ethers.getSigners();
  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdmin = await ProxyAdmin.attach(PROXY_ADMIN_ADDRESS);
  const proxyAdminOwner = await proxyAdmin.owner();

  if ((await address(signers[0])) != proxyAdminOwner) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [proxyAdminOwner],
    });
  }
  const owner = await ethers.getSigner(proxyAdminOwner);
  console.log("ProxyAdmin owner:", owner);

  // Deploy new vesting contract
  // const vesting = await Vesting.connect(owner).deploy();
  // await vesting.deployed();
  // console.log(`Vesting deployed at ${vesting.address}`);

  const vesting = "0x99d643a1109bC0D3c06Ca38FfC33DA0Fe33A8C9E";

  // Call upgrade on proxy admin to new implementations
  let tx = await proxyAdmin
    .connect(owner)
    .upgrade(ECOSYSTEM_VESTING_ADDRESS, vesting);
  await tx.wait();
  console.log("Ecosystem Vesting upgraded");

  await proxyAdmin.connect(owner).upgrade(GAMEPLAY_VESTING_ADDRESS, vesting);
  await tx.wait();
  console.log("Gameplay Vesting upgraded");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
