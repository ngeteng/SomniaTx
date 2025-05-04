const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const { abi: routerAbi } = require('./abi/UniswapV3Router.json');
const { abi: erc20Abi } = require('./abi/ERC20.json');
const wallets = require('../../utils/wallets.json');

// ==================== Tambahan sleep ====================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// ========================================================

async function main() {
  for (const walletInfo of wallets) {
    const provider = new ethers.providers.JsonRpcProvider(walletInfo.rpc);
    const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
    const router = new ethers.Contract(walletInfo.routerAddress, routerAbi, wallet);

    for (const tokenSwap of walletInfo.swaps) {
      const tokenInData = walletInfo.tokens.find(t => t.symbol === tokenSwap.tokenIn);
      const tokenOutData = walletInfo.tokens.find(t => t.symbol === tokenSwap.tokenOut);
      const tokenInContract = new ethers.Contract(tokenInData.address, erc20Abi, wallet);
      const decimals = await tokenInContract.decimals();
      const amountInWei = ethers.utils.parseUnits(tokenSwap.amount, decimals);

      const balance = await tokenInContract.balanceOf(wallet.address);
      if (balance.lt(amountInWei)) {
        console.log(`[${wallet.address}] Saldo ${tokenSwap.tokenIn} tidak cukup, lewati.`);
        continue;
      }

      const allowance = await tokenInContract.allowance(wallet.address, walletInfo.routerAddress);
      if (allowance.lt(amountInWei)) {
        const approveTx = await tokenInContract.approve(walletInfo.routerAddress, amountInWei);
        console.log(`[${wallet.address}] Approving... ${approveTx.hash}`);
        await approveTx.wait();
        console.log(`[${wallet.address}] Approve confirmed.`);
      }

      const deadline = Math.floor(Date.now() / 1000) + 600;

      const quote = await router.callStatic.exactInputSingle({
        tokenIn: tokenInData.address,
        tokenOut: tokenOutData.address,
        fee: 500,
        recipient: wallet.address,
        deadline,
        amountIn: amountInWei,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      });

      console.log(`[${wallet.address}] Akan swap ${tokenSwap.amount} ${tokenSwap.tokenIn} >> ${ethers.utils.formatUnits(quote, await tokenInContract.decimals())} ${tokenSwap.tokenOut}`);

      const tx = await router.exactInputSingle({
        tokenIn: tokenInData.address,
        tokenOut: tokenOutData.address,
        fee: 500,
        recipient: wallet.address,
        deadline,
        amountIn: amountInWei,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      });

      console.log(`[${wallet.address}] Swap tx: ${tx.hash}`);
      await tx.wait();
      console.log(`[${wallet.address}] Swap confirmed.`);

      // ======= Delay 33 detik sebelum swap berikutnya =======
      console.log(`[${wallet.address}] Menunggu 33 detik sebelum swap selanjutnya...`);
      await sleep(33000);
      // ======================================================
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
