const ethers = require('ethers');
const inquirer = require('inquirer');
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

    if (walletInfo.autoSwaps && Array.isArray(walletInfo.autoSwaps)) {
      for (const swapInfo of walletInfo.autoSwaps) {
        const tokenInContract = new ethers.Contract(swapInfo.tokenIn, erc20Abi, wallet);
        const decimals = await tokenInContract.decimals();
        const amountInWei = ethers.utils.parseUnits(swapInfo.amount, decimals);

        const balance = await tokenInContract.balanceOf(wallet.address);
        if (balance.lt(amountInWei)) {
          console.log('Saldo tidak cukup, lewati swap ini.');
          continue;
        }

        const allowance = await tokenInContract.allowance(wallet.address, walletInfo.routerAddress);
        if (allowance.lt(amountInWei)) {
          const approveTx = await tokenInContract.approve(walletInfo.routerAddress, amountInWei);
          console.log(`Approve tx: ${approveTx.hash}`);
          await approveTx.wait();
        }

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

        try {
          const tx = await router.exactInputSingle({
            tokenIn: swapInfo.tokenIn,
            tokenOut: swapInfo.tokenOut,
            fee: 500,
            recipient: wallet.address,
            deadline,
            amountIn: amountInWei,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0,
          });
          console.log(`Swap tx submitted: ${tx.hash}`);
          await tx.wait();
          console.log(`Swap tx confirmed: ${tx.hash}`);

          // ======= Delay 33 detik sebelum swap berikutnya =======
          console.log('Menunggu 33 detik sebelum swap otomatis berikutnya…');
          await sleep(33000);
          // =======================================================
        } catch (err) {
          console.log(`Swap gagal: ${err.message}`);
        }
      }
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
