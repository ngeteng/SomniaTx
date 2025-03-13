## Somnia Testnet

👋 Hello! This script will help you to be well-positioned & increase your transactions, activites & interactions on Somnia Testnet
Not know about it? Please read this article to know more about them: - https://cryptorank.io/price/somnia

```bash

SomniaTestnet/
├── actions/                                  # Directory for action scripts or modules.
│   ├── official_faucet/                      # Contains scripts related to the official faucet functionalities.
│   │   ├── claim.js                          # Main script to allow users to claim tokens from the official faucet.
│   │   └── scripts/                          # Auxiliary scripts for faucet operations.
│   │       └── apis.js                       # Script that handles API interactions for faucet operations.
│   ├── SomniaSwap/                           # Contains scripts for the SomniaSwap module (To be implemented).
│   │   ├── ABI.js                            # Exports the ABI definitions for SomniaSwap contracts (To be implemented).
│   │   ├── swap.js                           # Handles swap operations for SomniaSwap (To be implemented).
│   │   └── launch.js                         # Script to launch the SomniaSwap module (To be implemented).
├── index.js                                  # Main script to bootstrap and initialize the SomniaTestnet project.
├── node_modules/                             # Contains all the installed npm packages and dependencies.
├── package.json                              # Project metadata and dependency definitions.
├── package-lock.json                         # Automatically generated file that locks the versions of dependencies.
├── README.md                                 # Documentation file with project overview and usage instructions.
└── utils/                                    # Utility scripts and helper modules for various operations.
    ├── chain.js                              # Module handling blockchain interactions and core chain functionalities.
    ├── proxies.txt                           # File with proxies generated from 2CAPTCHA in format socks5://login:pass@ip:port.
    ├── wallet_aggregator.js                  # Script to aggregate and manage wallet information.
    ├── wallet_generator.js                   # Module responsible for generating new wallet instances.
    └── wallets.json                          # JSON file storing wallet configurations and data.

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


