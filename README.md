## Somnia Testnet

👋 Hello! This script will help you to be well-positioned & increase your transactions, activites & interactions on Somnia Testnet
Not know about it? Please read this article to know more about them: - https://cryptorank.io/price/somnia

```bash

SomniaTestnet/
├── actions/                                  # Directory for action scripts or modules.
│   ├── official_faucet/                      # Contains scripts related to the official faucet functionalities.
│   │   ├── claim.js                          # Main script to allow users to claim tokens from the official faucet.
│   │   └── scripts/                          # Auxiliary scripts for faucet operations.
│   │       └── apis.js                       # Handles API interactions for faucet operations.
│   ├── SomniaSwap/                           # Contains scripts for the SomniaSwap module.
│   │   ├── ABI.js                            # Exports the ABI definitions for SomniaSwap contracts.
│   │   ├── swap.js                           # Handles swap operations for SomniaSwap.
│   │   └── random.js                         # Automated script to perform a random number of swap transactions.
│   ├── memecoin_trading_contest/             # Contains scripts for the memecoin trading contest.
│   │   ├── ABI.js                            # Contains contract addresses and ABI definitions for the contest.
│   │   ├── mint.js                           # Script for minting tokens (only once per wallet) for the contest.
│   │   ├── random.js                         # Automated script to perform a random number of swap transactions for contest tokens.
│   │   └── swap.js                           # Handles swap operations for contest tokens with custom logic.
│   └── deployContract/                       # New directory for deploying contracts.
│       ├── deploy_contract/                # For general smart contract deployment.
│       │   ├── ABI.js                      # Exports the ABI for the contract.
│       │   ├── compilate.js                # Script to compile the contract.
│       │   ├── contract.sol                # Solidity source code for the contract.
│       │   └── deploy.js                   # Script to deploy the compiled contract.
│       ├── deploy_nft/                     # For NFT contract deployment.
│       │   ├── ABI.js                      # Exports the ABI for the NFT contract.
│       │   ├── compilate.js                # Script to compile the NFT contract.
│       │   ├── contract.sol                # Solidity source code for the NFT contract.
│       │   └── deploy.js                   # Script to deploy the compiled NFT contract.
│       └── deploy_token/                   # For token contract deployment.
│           ├── ABI.js                      # Exports the ABI for the token contract.
│           ├── compilate.js                # Script to compile the token contract.
│           ├── contract.sol                # Solidity source code for the token contract.
│           └── deploy.js                   # Script to deploy the compiled token contract.
├── index.js                                  # Main script to bootstrap and initialize the SomniaTestnet project.
├── node_modules/                             # Contains all installed npm packages and dependencies.
├── package.json                              # Project metadata and dependency definitions.
├── package-lock.json                         # Automatically generated file locking dependency versions.
├── README.md                                 # Documentation file with project overview and usage instructions.
└── utils/                                    # Utility scripts and helper modules.
    ├── chain.js                              # Contains RPC URL, chain ID, token symbol, and explorer links.
    ├── proxies.txt                           # Lists proxies (socks5 format) generated from 2CAPTCHA.
    ├── wallet_aggregator.js                  # Aggregates and manages wallet information.
    ├── wallet_generator.js                   # Generates new wallet instances.
    ├── wallets.json                          # Stores wallet configurations and data.
    ├── balanceChecker.js                     # Checks and displays the current balance of each wallet.
    └── txCount.js                            # Checks and displays the total number of transactions per wallet.

```

## Instructions.

1. git clone https://github.com/Naeaerc20/SomniaTestnet
2. cd SomniaTestnet
3. npm install
4. Follow any of the following prompts to interact with the project:

- npm start - (runs index.js main code)
- npm run add - (run node utils/wallet_aggregator.js - allowing you to add your existing addresses)
- npm run generate - (run utils/wallet_generator.js - allowing you to generate new addresses to participate in Monad Testnet)

Good Luck! :)


