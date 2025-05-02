const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const colors = require('colors');

const chain = require('../../utils/chain.js');
const { ABI, PONG_CONTRACT, PING_CONTRACT, ROUTER_CONTRACT } = require('./ABI.js');

let wallets = [];
try {
  const walletsPath = path.join(__dirname, '..', '..', 'utils', 'wallets.json');
  wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
} catch (error) {
  console.error('Error reading wallets.json:'.red, error);
  process.exit(1);
}

wallets.sort(() => Math.random() - 0.5);

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const swapAbi = ABI.find(item => item.name === 'exactInputSingle' && item.type === 'function');
if (!swapAbi) {
  console.error('"exactInputSingle" not found in ABI.'.red);
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(chain.RPC_URL, chain.CHAIN_ID);
const tokens = [
  { name: 'PONG', address: PONG_CONTRACT },
  { name: 'PING', address: PING_CONTRACT }
];

// Helper functions
async function getTokenBalance(tokenAddress, walletAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const [rawBalance, decimals] = await Promise.all([
    tokenContract.balanceOf(walletAddress),
    tokenContract.decimals()
  ]);
  return Number(ethers.utils.formatUnits(rawBalance, decimals));
}

async function getTokenDecimals(tokenAddress) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return tokenContract.decimals();
}

async function checkAndApproveToken(tokenAddress, tokenName, signer, amountNeeded) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const allowance = await tokenContract.allowance(owner, ROUTER_CONTRACT);
  if (allowance.gte(amountNeeded)) return;
  console.log(`🔥 Approving - [${tokenName}] to be used by Router...`.yellow);
  const maxUint = ethers.constants.MaxUint256;
  const tx = await tokenContract.approve(ROUTER_CONTRACT, maxUint);
  await tx.wait();
  console.log(`✅ [${tokenName}] has been approved for Router usage.`.green);
  await new Promise(res => setTimeout(res, 2000));
}

async function processWallet(wallet) {
  const signer = new ethers.Wallet(wallet.privateKey, provider);
  const walletAddress = wallet.address;
  console.log(`\n🚀 Processing Wallet [${wallet.id}] - ${walletAddress}\n`.green);

  const initialNative = await provider.getBalance(walletAddress);
  if (initialNative.isZero()) return;

  const numSwaps = Math.floor(Math.random() * (18000 - 100000 + 1)) + 100000;
  console.log(`💼 Wallet [${wallet.id}] will perform ${numSwaps} swaps.`.blue);

  for (let i = 1; i <= numSwaps; i++) {
    console.log(`🔄 Swap ${i} for Wallet [${wallet.id}]`.yellow);

    const swapDirection = Math.floor(Math.random() * 2);
    const tokenA = swapDirection === 0 ? tokens[0] : tokens[1];
    const tokenB = swapDirection === 0 ? tokens[1] : tokens[0];

    const currentBalanceA = await getTokenBalance(tokenA.address, walletAddress);
    if (currentBalanceA === 0) continue;

    const randomPercentage = (Math.random() * 0.6) + 0.4;
    const amountToSwap = Number((currentBalanceA * randomPercentage).toFixed(3));
    if (amountToSwap === 0) continue;

    console.log(`✨ Swap Amount: ${amountToSwap} ${tokenA.name}`.magenta);

    await checkAndApproveToken(
      tokenA.address,
      tokenA.name,
      signer,
      ethers.utils.parseUnits(amountToSwap.toString(), await getTokenDecimals(tokenA.address))
    );

    const routerContract = new ethers.Contract(ROUTER_CONTRACT, [swapAbi], signer);
    const swapParams = {
      tokenIn: tokenA.address,
      tokenOut: tokenB.address,
      fee: 500,
      recipient: walletAddress,
      amountIn: ethers.utils.parseUnits(amountToSwap.toString(), await getTokenDecimals(tokenA.address)),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };

    // Retry logic: up to MAX_RETRIES attempts
    const MAX_RETRIES = 3;
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        // Simulate swap
        const outBN = await routerContract.callStatic.exactInputSingle(swapParams);
        console.log(
          `💡 Expected: [${ethers.utils.formatUnits(
            outBN,
            await getTokenDecimals(tokenB.address)
          )} ${tokenB.name}]`.green
        );

        // Execute swap
        console.log(`🚀 Executing Swap [${tokenA.name} -> ${tokenB.name}] Attempt ${attempt}`.yellow);
        const tx = await routerContract.exactInputSingle(swapParams);
        const receipt = await tx.wait();
        console.log(`✅ Swap successful on attempt ${attempt}: ${receipt.transactionHash}`.green);
        break; // exit retry loop on success
      } catch (error) {
        console.error(
          `❌ Swap attempt ${attempt} failed: ${error.code || error.message}`.red
        );
        if (attempt >= MAX_RETRIES) {
          console.error(`🔴 All ${MAX_RETRIES} swap attempts failed, moving to next swap.`.red);
        } else {
          console.log(`⏳ Retrying swap (attempt ${attempt + 1}/${MAX_RETRIES})...`.yellow);
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    }

    // Delay before next swap
    await new Promise(r => setTimeout(r, 3000));
  }
}

async function main() {
  for (const wallet of wallets) await processWallet(wallet);
  console.log('\nAll done! Exiting random.js'.green);
}

main();
