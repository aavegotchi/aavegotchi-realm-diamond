## How to deploy

1. Set .env for INSTALLATION_GOTCHICHAIN_DIAMOND_ADDRESS, TILES_GOTCHICHAIN_DIAMOND_ADDRESS, INSTALLATION_POLYGON_DIAMOND_ADDRESS, TILES_POLYGON_DIAMOND_ADDRESS, LZ_ENDPOINT_ADDRESS_MUMBAI, LZ_ENDPOINT_ADDRESS_GOTCHICHAIN, LZ_CHAIN_ID_GOTCHICHAIN, LZ_CHAIN_ID_MUMBAI
2. Run `npx hardhat run scripts/bridge/deployGotchichain.ts --network supernets`
3. Set .env for INSTALLATION_GOTCHICHAIN_BRIDGE_ADDRESS, TILES_GOTCHICHAIN_BRIDGE_ADDRESS
4. Run `npx hardhat run scripts/bridge/deployPolygon.ts --network mumbai/polygon`
5. Set .env for BRIDGE_POLYGON_ADDRESS
6. RUN `npx hardhat run scripts/bridge/setupBridgeGotchichain.ts --network supernets`
7.  RUN `npx hardhat run scripts/bridge/setupBridgePolygon.ts --network mumbai/polygon`