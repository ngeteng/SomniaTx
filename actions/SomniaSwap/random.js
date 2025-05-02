// actions/SomniaSwap/random.js

const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
require('colors');

// ======= Konfigurasi Chain & Token =======
const chain = require('../../utils/chain.js');
// Pastikan utils/chain.js mengekspor:
// {
//   RPC_URL,
//   CHAIN_ID,
//   ROUTER_ADDRESS,
//   ROUTER_ABI,
//   ERC20_ABI,
//   TOKEN_IN_ADDRESS,
//   TOKEN_OUT_ADDRESS,
//   TOKEN_IN_DECIMALS,
//   TOKEN_OUT_DECIMALS,
//   FEE,
//   DEADLINE,
//   GAS_LIMIT
// }

// Array token untuk kemudahan referensi
const tokens = [chain.TOKEN_IN_ADDRESS, chain.TOKEN_OUT_ADDRESS];

// Nilai tetap: 5 unit tiap swap
const SWAP_AMOUNT_A = ethers.utils.parseUnits("5", chain.TOKEN_IN_DECIMALS);
const SWAP_AMOUNT_B = ethers.utils.parseUnits("5", chain.TOKEN_OUT_DECIMALS);

// Jumlah ping-pong swap
const NUM_PING = 5;
const NUM_PONG = 5;
const NUM_SWAPS = 10000;

// ======= Load Wallets =======
const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));

// ======= Inisialisasi Provider & Router =======
const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);
const routerContract = new ethers.Contract(chain.ROUTER_ADDRESS, chain.ROUTER_ABI, provider);

// ======= Fungsi ping-pong swap =======
async function pingPongSwap(signer) {
  const recipient = await signer.getAddress();

  // 1) Swap A → B (5 token A)
  const tokenInContract = new ethers.Contract(chain.TOKEN_IN_ADDRESS, chain.ERC20_ABI, signer);
  await (await tokenInContract.approve(chain.ROUTER_ADDRESS, SWAP_AMOUNT_A)).wait();

  const paramsAB = {
    tokenIn: chain.TOKEN_IN_ADDRESS,
    tokenOut: chain.TOKEN_OUT_ADDRESS,
    fee: chain.FEE,
    recipient,
    deadline: Math.floor(Date.now() / 1000) + chain.DEADLINE,
    amountIn: SWAP_AMOUNT_A,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0
  };
  const txAB = await routerContract.connect(signer).exactInputSingle(paramsAB, { gasLimit: chain.GAS_LIMIT });
  const receiptAB = await txAB.wait();
  console.log(`  ✔ Ping (A→B) tx: ${receiptAB.transactionHash}`.green);

  // 2) Swap B → A (5 token B)
  const tokenOutContract = new ethers.Contract(chain.TOKEN_OUT_ADDRESS, chain.ERC20_ABI, signer);
  await (await tokenOutContract.approve(chain.ROUTER_ADDRESS, SWAP_AMOUNT_B)).wait();

  const paramsBA = {
    tokenIn: chain.TOKEN_OUT_ADDRESS,
    tokenOut: chain.TOKEN_IN_ADDRESS,
    fee: chain.FEE,
    recipient,
    deadline: Math.floor(Date.now() / 1000) + chain.DEADLINE,
    amountIn: SWAP_AMOUNT_B,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0
  };
  const txBA = await routerContract.connect(signer).exactInputSingle(paramsBA, { gasLimit: chain.GAS_LIMIT });
  const receiptBA = await txBA.wait();
  console.log(`  ✔ Pong (B→A) tx: ${receiptBA.transactionHash}`.green);
}

// ======= Main =======
(async () => {
  console.log(`Starting SomniaSwap ping-pong: ${NUM_PING} ping + ${NUM_PONG} pong per wallet\n`.bold);

  for (const wallet of wallets) {
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const address = await signer.getAddress();
    console.log(`💼 Wallet [${wallet.id}] – ${address}`.blue);
    console.log(`🔄 Will perform ${NUM_SWAPS} swaps (5 ping + 5 pong)`.cyan);

    for (let i = 1; i <= NUM_SWAPS; i++) {
      // Tentukan arah berdasarkan index:
      // 1..5 = ping; 6..10 = pong
      const phase = (i <= NUM_PING) ? 'ping' : 'pong';
      console.log(`  ↔ Swap #${i} (${phase.toUpperCase()})`.yellow);

      try {
        await pingPongSwap(signer);
      } catch (err) {
        console.error(`  ❌ Error on swap #${i}: ${err.message}`.red);
        // Lanjut ke swap berikutnya meski ada error
      }

      // Opsi: tambahkan delay jika perlu
      // await new Promise(r => setTimeout(r, 2000));
    }

    console.log('—'.repeat(40));
  }

  console.log('\nAll wallets processed.'.bold);
})();
