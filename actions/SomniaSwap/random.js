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

// Nilai swap per iterasi (5 unit A dan 5 unit B)
const SWAP_AMOUNT_A = ethers.utils.parseUnits("5", chain.TOKEN_IN_DECIMALS);
const SWAP_AMOUNT_B = ethers.utils.parseUnits("5", chain.TOKEN_OUT_DECIMALS);

// Tetapkan jumlah ping/pong
const NUM_PING = 5;
const NUM_PONG = 5;
const numSwaps = 10000;

// ======= Load Wallets =======
const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));

// ======= Inisialisasi Provider & Router =======
const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);
const routerContract = new ethers.Contract(chain.ROUTER_ADDRESS, chain.ROUTER_ABI, provider);

// ======= Fungsi swap tunggal =======
async function doSwap(signer, tokenInAddr, tokenOutAddr, amountIn) {
  // Approve tokenIn ke router
  const tokenInContract = new ethers.Contract(tokenInAddr, chain.ERC20_ABI, signer);
  await (await tokenInContract.approve(chain.ROUTER_ADDRESS, amountIn)).wait();

  // Siapkan parameter swap
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

  // Eksekusi swap
  const tx = await routerContract.connect(signer).exactInputSingle(params, { gasLimit: chain.GAS_LIMIT });
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

// ======= Main =======
(async () => {
  console.log(`Starting SomniaSwap fixed ping-pong: ${NUM_PING} ping + ${NUM_PONG} pong per wallet\n`.bold);

  for (const wallet of wallets) {
    const signer = new ethers.Wallet(wallet.privateKey, provider);
    const address = await signer.getAddress();
    console.log(`💼 Wallet [${wallet.id}] – ${address}`.blue);
    console.log(`🔄 Will perform ${numSwaps} swaps (5 ping + 5 pong)`.cyan);

    for (let i = 1; i <= numSwaps; i++) {
      // Tentukan arah berdasarkan indeks:
      // 1..5 → ping (A→B), 6..10 → pong (B→A)
      const isPing = i <= NUM_PING;
      const tokenInAddr  = isPing ? tokens[0] : tokens[1];
      const tokenOutAddr = isPing ? tokens[1] : tokens[0];
      const amountIn     = isPing ? SWAP_AMOUNT_A : SWAP_AMOUNT_B;
      const label        = isPing ? 'Ping (A→B)' : 'Pong (B→A)';

      console.log(`  ↔ Swap #${i} ${label}`.yellow);
      try {
        const txHash = await doSwap(signer, tokenInAddr, tokenOutAddr, amountIn);
        console.log(`    ✔ ${label} tx: ${txHash}`.green);
      } catch (err) {
        console.error(`    ❌ Error on swap #${i}: ${err.message}`.red);
      }

      // Jika butuh delay antar swap, bisa di-uncomment:
      // await new Promise(r => setTimeout(r, 2000));
    }

    console.log('-'.repeat(40));
  }

  console.log('\nAll wallets processed.'.bold);
})();
