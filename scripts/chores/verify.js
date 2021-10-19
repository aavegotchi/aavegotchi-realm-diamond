const { run } = require("hardhat");

/*
Diamond address: 0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe
DiamondCutFacet: 0x27f09D8Bfb88C80498788D5DfAa25eae5b984A78
DiamondInit: 0xd98c8146785A05473030ff1053c0E89Dcc8473Fc

OwnershipFacet: 0x5F10fCEF9EF0a128d82AffC688D8A479bf40a818

GBMFacet:  0x70461FC4FE6d28a8D5B492B3007193DdA4C4A2A5
SettingsFacet: 0x64a4d92Fdb7561810063F5756e65b0E3CDb85A64
DiamondLoupeFacet: 0xa23fbAC1B441787d6469F9C1E17B51B3F3C5DE28
*/

async function verify() {
  const address = "0x5F10fCEF9EF0a128d82AffC688D8A479bf40a818"; // deployed address
  const facet = "OwnershipFacet"; // name of facet
  await run("verifyFacet", {
    apikey: process.env.POLYGON_API_KEY,
    contract: address,
    facet: facet,
  });
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.VerifyFacet = verify;
