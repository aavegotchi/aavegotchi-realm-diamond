# Batch GHST Transfer Script

This script allows you to send GHST tokens to multiple addresses in batches of 100 using the `batchTransferTokens` function from the AlchemicaFacet contract.

## Prerequisites

- Node.js and npm installed
- Hardhat installed
- Access to the Aavegotchi Realm Diamond contract
- Sufficient GHST tokens in your wallet

## Setup

1. Make sure you have the correct network configuration in your Hardhat config file.
2. Ensure you have the necessary environment variables set up.

## Usage

1. Edit the `scripts/batchTransferGHST.ts` file to add your list of addresses:

```typescript
const allAddresses = [
  "0x1234567890123456789012345678901234567890",
  "0x0987654321098765432109876543210987654321",
  // Add more addresses here
];
```

2. Adjust the amount of GHST to send to each address:

```typescript
const amountPerAddress = ethers.utils.parseEther("1.0"); // 1 GHST per address
```

3. Run the script:

```bash
npx hardhat run scripts/batchTransferGHST.ts --network <network-name>
```

Replace `<network-name>` with the name of the network you want to use (e.g., `matic` for Polygon mainnet).

## How It Works

1. The script first checks if you have approved the Realm Diamond contract to spend your GHST tokens.
2. If not, it will request approval for the maximum amount.
3. It then processes the addresses in batches of 100 to avoid hitting gas limits.
4. For each batch, it calls the `batchTransferTokens` function on the AlchemicaFacet contract.
5. The script logs the progress and any errors that occur during the process.

## Notes

- Make sure you have enough GHST tokens to cover all transfers plus gas fees.
- The script uses the default gas price from your constants file. Adjust if needed.
- If a batch fails, the script will log the error and continue with the next batch.
