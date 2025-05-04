const ethers = require('ethers');
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

    for (const swapInfo of walletInfo.autoSwaps) {
      const tokenIn = swapInfo.tokenIn;
      const tokenOut = swapInfo.tokenOut;
      const amount = swapInfo.amount;

      const tokenInContract = new ethers.Contract(tokenIn, erc20Abi, wallet);
      const decimals = await tokenInContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      const balance = await tokenInContract.balanceOf(wallet.address);
      if (balance.lt(amountInWei)) {
        console.log(`Saldo tidak cukup di wallet ${wallet.address}, lewati.`);
        continue;
      }

      const allowance = await tokenInContract.allowance(wallet.address, walletInfo.routerAddress);
      if (allowance.lt(amountInWei)) {
        const approveTx = await tokenInContract.approve(walletInfo.routerAddress, amountInWei);
        console.log(`Approve tx: ${approveTx.hash}`);
        await approveTx.wait();
        console.log(`Approve confirmed: ${approveTx.hash}`);
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      try {
        const quote = await router.callStatic.exactInputSingle({
          tokenIn,
          tokenOut,
          fee: 500,
          recipient: wallet.address,
          deadline,
          amountIn: amountInWei,
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0,
        });
        console.log(`Quote for ${wallet.address}: ${ethers.utils.formatUnits(quote, decimals)}`);
      } catch (e) {
        console.log(`Quote gagal di wallet ${wallet.address}: ${e.message}`);
        continue;
      }

      try {
        const tx = await router.exactInputSingle({
          tokenIn,
          tokenOut,
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

        // ===== Tambahan delay 33 detik =====
        console.log('Menunggu 33 detik sebelum swap berikutnya...');
        await sleep(33000);
        // ===================================
      } catch (e) {
        console.log(`Swap gagal di wallet ${wallet.address}: ${e.message}`);
      }
    }
  }
}

main().catch(console.error);
