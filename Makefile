-include .env

export FOUNDRY_ETH_RPC_URL=${MATIC_URL}

.PHONY: test
test-foundry-diamond: node_modules
	@echo Run diamond tests
	@forge test -vvv -c test/foundry

