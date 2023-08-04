import { ethers } from "hardhat";

export default async function addAllowlist(account: string) {
  const abi = [
    "function setAdmin(address)",
    "function setEnabled(address)",
    "function setNone(address)",
  ];

  const contractAddress = "0x0200000000000000000000000000000000000002";

  const contract = new ethers.Contract(
    contractAddress,
    abi,
    ethers.provider.getSigner()
  );

  console.log(`Adding ${account} to allowlist...`);

  const tx = await contract.setEnabled(account, {
    // gasLimit: 100000,
  });

  await tx.wait();

  console.log(`${account} added to allowlist.`);
}