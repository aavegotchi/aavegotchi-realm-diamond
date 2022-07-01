-include .env


ifeq (${NETWORK}, matic)
  export FOUNDRY_ETH_RPC_URL=${MATIC_URL}
  export FOUNDRY_FORK_BLOCK_NUMBER=30222587
else
  ifeq (${NETWORK}, mumbai)
  	export FOUNDRY_ETH_RPC_URL=${MUMBAI_URL}
    export FOUNDRY_FORK_BLOCK_NUMBER=26990486
  endif
endif

export FOUNDRY_ETH_RPC_URL=${MATIC_URL}

update-submodules: 
	@echo Update git submodules
	@git submodule update --init --recursive

test-foundry-diamond: 
	@echo Run diamond tests
	@forge test -vvv -c test/foundry

