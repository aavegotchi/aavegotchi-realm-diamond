const { run } = require("hardhat");

async function verify() {
  const address = "0xC1572d67f0f3d3F33F9b7f0a077F3A486Ab58964"; // deployed address

  await run("verify:verify", {
    // apikey: process.env.POLYGON_API_KEY,
    address: address,
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
