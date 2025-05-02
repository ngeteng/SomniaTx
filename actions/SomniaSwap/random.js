import { ethers } from 'ethers';
import * as chain from '../config/chain';
import { routerContract } from '../config/router';
import tokens from '../config/tokens.json';

async function doSwap(signer, tokenInAddr, tokenOutAddr, amountIn) {
  try {
    const tokenInContract = new ethers.Contract(tokenInAddr, chain.ERC20_ABI, signer);
    await (await tokenInContract.approve(chain.ROUTER_ADDRESS, amountIn)).wait();

    const params = {
      tokenIn: tokenInAddr,
      tokenOut: tokenOutAddr,
      fee: chain.FEE,
      recipient: await signer.getAddress(),
      deadline: Math.floor(Date.now() / 1000) + chain.DEADLINE,
      amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };

    const tx = await routerContract.connect(signer).exactInputSingle(params, { gasLimit: chain.GAS_LIMIT });
    const receipt = await tx.wait();
    console.log(`Swap successful: ${receipt.transactionHash}`);
    return receipt.transactionHash;
  } catch (error) {
    console.error(`doSwap error for token ${tokenInAddr}: ${error.message}`);
    return null;
  }
}

async function randomSwap() {
  const provider = new ethers.providers.WebSocketProvider(chain.WSS_URL);
  const wallets = chain.PRIVATE_KEYS.map(pk => new ethers.Wallet(pk, provider));

  for (const wallet of wallets) {
    for (const token of tokens) {
      const amountIn = tokens[token]; // adjust if needed
      console.log(`Attempting swap ${token} -> ${tokens[token]}`);

      const hash = await doSwap(wallet, token, tokens[token], amountIn);

      if (!hash) {
        console.log('Swap failed, continuing to next token...');
        continue;
      }

      // Delay if needed
      await new Promise(res => setTimeout(res, chain.SWAP_INTERVAL));
    }
  }
}

randomSwap().catch(err => console.error(`Script error: ${err.message}`));
