import { BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";

import {
  AlchemicaVesting,
  ProxyAdmin,
  TransparentUpgradeableProxy,
  AlchemicaToken,
} from "../../../typechain";
import { impersonate } from "../../helperFunctions";
import {
  FUD_ADDRESS,
  FOMO_ADDRESS,
  ALPHA_ADDRESS,
  KEK_ADDRESS,
  GAMEPLAY_VESTING_ADDRESS,
  ECOSYSTEM_VESTING_ADDRESS,
} from "../../../helpers/constants";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const currentProxyAdmin = "0xB549125b4A2F3c1B4319b798EcDC72b04315dF2D";
  const multisig = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119"; //multisig

  const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
  let oldProxyAdmin = (await (
    await ethers.getContractAt("ProxyAdmin", currentProxyAdmin)
  ).connect(deployer)) as ProxyAdmin;
  console.log("Old Proxy Admin Address: ", oldProxyAdmin.address);
  console.log("Old Proxy Admin Owner: ", await oldProxyAdmin.owner());
  let newProxyAdmin: ProxyAdmin = (await ProxyAdmin.deploy()) as ProxyAdmin;
  await newProxyAdmin.deployed();
  await newProxyAdmin.transferOwnership(multisig);
  console.log("New Proxy Admin Address: ", newProxyAdmin.address);
  console.log("New Proxy Admin Owner: ", await newProxyAdmin.owner());

  const testing = ["hardhat"].includes(network.name);

  if (testing) {
    oldProxyAdmin = await impersonate(
      await oldProxyAdmin.owner(),
      oldProxyAdmin,
      ethers,
      network
    );
  }

  const fud = await ethers.getContractAt("AlchemicaToken", FUD_ADDRESS);
  const fomo = await ethers.getContractAt("AlchemicaToken", FOMO_ADDRESS);
  const alpha = await ethers.getContractAt("AlchemicaToken", ALPHA_ADDRESS);
  const kek = await ethers.getContractAt("AlchemicaToken", KEK_ADDRESS);
  const gameplayVesting = await ethers.getContractAt(
    "AlchemicaVesting",
    GAMEPLAY_VESTING_ADDRESS
  );
  const ecosystemVesting = await ethers.getContractAt(
    "AlchemicaVesting",
    ECOSYSTEM_VESTING_ADDRESS
  );

  // ALCHEMICA PROXY ADMIN TRANSFERS

  let tx = await oldProxyAdmin.changeProxyAdmin(
    FUD_ADDRESS,
    newProxyAdmin.address
  );
  await tx.wait();
  tx = await oldProxyAdmin.changeProxyAdmin(
    FOMO_ADDRESS,
    newProxyAdmin.address
  );
  await tx.wait();
  tx = await oldProxyAdmin.changeProxyAdmin(
    ALPHA_ADDRESS,
    newProxyAdmin.address
  );
  await tx.wait();
  tx = await oldProxyAdmin.changeProxyAdmin(KEK_ADDRESS, newProxyAdmin.address);
  await tx.wait();

  // VESTING PROXY ADMIN TRANSFERS

  tx = await oldProxyAdmin.changeProxyAdmin(
    GAMEPLAY_VESTING_ADDRESS,
    newProxyAdmin.address
  );
  await tx.wait();
  tx = await oldProxyAdmin.changeProxyAdmin(
    ECOSYSTEM_VESTING_ADDRESS,
    newProxyAdmin.address
  );
  await tx.wait();

  console.log(
    "FUD new Proxy Admin: ",
    await newProxyAdmin.getProxyAdmin(FUD_ADDRESS)
  );
  console.log(
    "FOMO new Proxy Admin: ",
    await newProxyAdmin.getProxyAdmin(FOMO_ADDRESS)
  );
  console.log(
    "ALPHA new Proxy Admin: ",
    await newProxyAdmin.getProxyAdmin(ALPHA_ADDRESS)
  );
  console.log(
    "KEK new Proxy Admin: ",
    await newProxyAdmin.getProxyAdmin(KEK_ADDRESS)
  );
  console.log(
    "GAMEPLAY Vesting new Proxy Admin: ",
    await newProxyAdmin.getProxyAdmin(GAMEPLAY_VESTING_ADDRESS)
  );
  console.log(
    "ECOSYSTEM Vesting new Proxy Admin: ",
    await newProxyAdmin.getProxyAdmin(ECOSYSTEM_VESTING_ADDRESS)
  );
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
