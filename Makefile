-include .env

#export FOUNDRY_ETH_RPC_URL=${MATIC_URL}
#export FOUNDRY_FORK_BLOCK_NUMBER?=30365922


update-submodules: 
	@echo Update git submodules
	@git submodule update --init --recursive

test-foundry-diamond: 
	@echo Run diamond tests
	@forge test -vvv -c test/foundry

test-harvesting:
	@echo Run harvesting tests
	@forge test -vvv -c test/foundry/harvesting

test-nftDisplay:
	@echo Running tests for NFT Displays
	@forge test --mc NFTDisplayTests -vvvvv  

test-events:
	@echo Running tests for Bounce Gates
	@forge test --mc BounceGateTests -vvvvv 

test-Consoles:
	@echo Running tests for Console and Cartridge receipts
	@forge test --mc ConsoleReceiptTests --rpc-url http://127.0.01:8545 -vvvvv  
