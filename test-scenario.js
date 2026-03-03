const { createWalletClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const chain = defineChain({
  id: 31337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
// Default anvil account #1
const account = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');

const walletClient = createWalletClient({ account, chain, transport: http() });

const VAULT_ABI = [
  { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

async function run() {
  console.log("== Starting Demo Scenario ==");

  console.log("1. Depositing 5 ETH...");
  await walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'deposit',
    value: parseEther('5')
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log("2. Normal Withdraw: 0.5 ETH...");
  await walletClient.writeContract({
     address: VAULT_ADDRESS,
     abi: VAULT_ABI,
     functionName: 'withdraw',
     args: [parseEther('0.5')]
  });

  await new Promise(r => setTimeout(r, 4000));

  console.log("3. Attack Simulation: Trying to withdraw 3 ETH...");
  try {
     await walletClient.writeContract({
         address: VAULT_ADDRESS,
         abi: VAULT_ABI,
         functionName: 'withdraw',
         args: [parseEther('3')]
     });
     console.log("Attack Transaction Mined. Guardian should have intercepted and set Safe Mode.");
  } catch (err) {
      console.log("Attack tx failed (possibly safe mode instantly reverted it or anvil error):", err.message);
  }
}

run().catch(console.error);
