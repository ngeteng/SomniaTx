const ethers = require('ethers');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { abi: routerAbi } = require('./abi/UniswapV3Router.json');
const { abi: erc20Abi } = require('./abi/ERC20.json');
const wallets = require('../../utils/wallets.json');

// ==================== Tambahan sleep ====================
/**
 * Pause execution for given milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// ========================================================

async function main() {
  for (const walletInfo of wallets) {
    const provider = new ethers.providers.JsonRpcProvider(walletInfo.rpc);
    const wallet = new ethers.Wallet(walletInfo.privateKey, provider);
    const router = new ethers.Contract(
      walletInfo.routerAddress,
      routerAbi,
      wallet
    );

    let keepSwapping = true;
    while (keepSwapping) {
      // Prompt: pilih token dan jumlah
      const { tokenIn, tokenOut, amount } = await inquirer.prompt([
        {
          type: 'list',
          name: 'tokenIn',
          message: 'Pilih token sumber:',
          choices: walletInfo.tokens.map(t => t.symbol),
        },
        {
          type: 'list',
          name: 'tokenOut',
          message: 'Pilih token tujuan:',
          choices: walletInfo.tokens.map(t => t.symbol),
        },
        {
          type: 'input',
          name: 'amount',
          message: 'Masukkan jumlah token sumber untuk swap:',
          validate: val => !isNaN(val) || 'Harus berupa angka',
        },
      ]);

      const tokenInData = walletInfo.tokens.find(t => t.symbol === tokenIn);
      const tokenOutData = walletInfo.tokens.find(t => t.symbol === tokenOut);
      const tokenInContract = new ethers.Contract(tokenInData.address, erc20Abi, wallet);
      const decimals = await tokenInContract.decimals();
      const amountInWei = ethers.utils.parseUnits(amount, decimals);

      // Cek saldo
      const balance = await tokenInContract.balanceOf(wallet.address);
      if (balance.lt(amountInWei)) {
        console.log('Saldo tidak cukup, lewati wallet ini.');
        break;
      }

      // Approve jika perlu
      const allowance = await tokenInContract.allowance(wallet.address, walletInfo.routerAddress);
      if (allowance.lt(amountInWei)) {
        const approveTx = await tokenInContract.approve(walletInfo.routerAddress, amountInWei);
        console.log(`Approve submitted: ${approveTx.hash}`);
        await approveTx.wait();
        console.log(`Approve confirmed: ${approveTx.hash}`);
      }

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 menit

      // Simulasi swap
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
      console.log(`Quote out: ${ethers.utils.formatUnits(quote, await tokenInContract.decimals())}`);

      // Eksekusi swap
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
      console.log(`Swap tx submitted: ${tx.hash}`);
      await tx.wait();
      console.log(`Swap tx confirmed: ${tx.hash}`);

      // ======= Delay 33 detik sebelum swap berikutnya =======
      console.log('Menunggu 33 detik sebelum swap berikutnya…');
      await sleep(33000);
      // =======================================================

      // Tanyakan lagi
if (walletInfo.auto) {
  console.log('Mode otomatis aktif, menunggu 33 detik sebelum swap berikutnya...');
  await sleep(33000);
  keepSwapping = true;
} else {
  const { again } = await inquirer.prompt({
    type: 'confirm',
    name: 'again',
    message: 'Swap lagi dengan wallet yang sama?',
    default: false,
  });
  keepSwapping = again;
}

    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
