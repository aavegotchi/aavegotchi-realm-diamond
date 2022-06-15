-include .env

export FOUNDRY_ETH_RPC_URL=${MATIC_URL}

update-submodules: 
	@echo Update git submodules
	@git submodule update --init --recursive

test-foundry-diamond: 
	@echo Run diamond tests
	@forge test -vvv -c test/foundry

