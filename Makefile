-include .env

export FOUNDRY_ETH_RPC_URL=${MATIC_URL}
export FOUNDRY_FORK_BLOCK_NUMBER?=30365922


update-submodules: 
	@echo Update git submodules
	@git submodule update --init --recursive

test-foundry-diamond: 
	@echo Run diamond tests
	@forge test -vvv -c test/foundry

test-harvesting:
	@echo Run harvesting tests
	@forge test -vvvv -c test/foundry/harvesting