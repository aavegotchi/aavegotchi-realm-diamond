import { Alchemy, Network } from "alchemy-sdk";
import fs from "fs";
const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.MATIC_MAINNET,
};

const aavegotchiContract = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

const PARCELS_CONTRACT = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";

// Modify updateParcelData function to track analytics
async function updateParcelData(): Promise<void> {
  const alchemy = new Alchemy(config);

  let pageKey = null;
  let allNfts: any[] = [];

  do {
    const response = await alchemy.nft.getNftsForContract(PARCELS_CONTRACT, {
      omitMetadata: false,
      pageSize: 100, // Maximum allowed page size
      pageKey: pageKey,
      //  omitMetadata: false,
    });

    allNfts = allNfts.concat(response.nfts);
    pageKey = response.pageKey;

    console.log(`Fetched ${allNfts.length} NFTs so far...`);

    // Optional: Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (pageKey); // Continue until no more pages

  console.log(`Total NFTs fetched: ${allNfts.length}`);

  //write to file
  fs.writeFileSync("allNfts.json", JSON.stringify(allNfts, null, 2));
}

async function main() {
  try {
    await updateParcelData();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
