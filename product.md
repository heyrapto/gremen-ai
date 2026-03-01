Perfect. Below is your **complete technical build guide** for:

> 🛡 AI-Powered Reactive On-Chain Guardian
> (Built using Somnia Reactivity – Testnet Only)

# 🧠 PROJECT OVERVIEW

## Goal

Build a Vault smart contract that:

1. Emits deposit/withdraw events
2. Is monitored using Somnia Reactivity (push model)
3. Sends event + state atomically to an AI backend
4. AI computes a risk score
5. If risk > threshold → contract enters Safe Mode automatically
6. UI updates in real time

---

# 🏗 SYSTEM ARCHITECTURE

```
Vault.sol (emits events)
        ↓
Somnia Reactivity (push)
        ↓
TypeScript AI Guardian
        ↓
Risk Score
        ↓
If High → call activateSafeMode()
        ↓
Frontend updates in real-time
```

---

# 📦 TECH STACK

### Smart Contracts

* Solidity 0.8.20
* Foundry
* Deployed on Somnia Testnet

### Backend

* Next.js 
* viem
* @somnia-chain/reactivity

### Frontend (minimal)

* Next.js
* Wallet connect
* Dashboard (Black + White + Glassmorphism monochrome dashboard)

---

# 🛠 PART 1 — SMART CONTRACT DESIGN

## Vault Contract Requirements

It must:

* Accept deposits
* Allow withdrawals
* Track total liquidity
* Support Safe Mode
* Emit events

---

## 📝 Vault.sol (MVP Version)

```solidity
pragma solidity ^0.8.20;

contract ReactiveVault {

    mapping(address => uint256) public balances;
    uint256 public totalLiquidity;
    bool public safeMode;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event SafeModeActivated(uint256 riskScore);

    modifier notSafeMode() {
        require(!safeMode, "Safe Mode Active");
        _;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        totalLiquidity += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external notSafeMode {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        totalLiquidity -= amount;

        payable(msg.sender).transfer(amount);

        emit Withdraw(msg.sender, amount);
    }

    function activateSafeMode(uint256 riskScore) external {
        safeMode = true;
        emit SafeModeActivated(riskScore);
    }

    function deactivateSafeMode() external {
        safeMode = false;
    }
}
```

---

# 🎯 Why This Design?

Simple.
Easy to simulate attack.
Clear liquidity variable.
Clear state change (safeMode).

---

# ⚡ PART 2 — REACTIVITY SUBSCRIPTION (OFF-CHAIN)

We will use:

```bash
npm i @somnia-chain/reactivity viem
```

---

## 🔌 SDK Setup

```typescript
import { createPublicClient, createWalletClient, http, defineChain } from 'viem'
import { SDK } from '@somnia-chain/reactivity'

const chain = defineChain({ /* Somnia Testnet config */ })

const publicClient = createPublicClient({
  chain,
  transport: http(),
})

const walletClient = createWalletClient({
  account,
  chain,
  transport: http(),
})

const sdk = new SDK({
  public: publicClient,
  wallet: walletClient,
})
```

---

# 📡 Subscribing to Withdraw Events

We want:

* Withdraw event
* totalLiquidity state
* safeMode state

---

## Subscription Setup

```typescript
const initParams = {
  ethCalls: [
    {
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'totalLiquidity',
    },
    {
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: 'safeMode',
    }
  ],
  onData: async (data) => {
    await handleEvent(data)
  },
}

await sdk.subscribe(initParams)
```

This ensures:

> Event + totalLiquidity delivered atomically from same block.

That is your Reactivity superpower.

---

# 🧠 PART 3 — AI RISK ENGINE

You do NOT need ML.

Use deterministic anomaly scoring.

---

## Risk Formula (MVP)

```typescript
function calculateRisk(eventAmount: number, totalLiquidity: number) {
    const percentage = (eventAmount / totalLiquidity) * 100

    let risk = 0

    // Weight 1 — Liquidity impact
    risk += percentage * 1.2

    // Weight 2 — Large transaction multiplier
    if (percentage > 30) risk += 25
    if (percentage > 50) risk += 40

    return Math.min(100, risk)
}
```

---

# 🎯 Event Handler Logic

```typescript
async function handleEvent(data) {

    const event = data.event
    const totalLiquidity = Number(data.ethCallResults[0])
    
    if (event.name !== "Withdraw") return

    const amount = Number(event.args.amount)

    const riskScore = calculateRisk(amount, totalLiquidity)

    console.log("Risk Score:", riskScore)

    if (riskScore > 80) {
        await activateSafeMode(riskScore)
    }
}
```

---

# 🔒 Activating Safe Mode

```typescript
async function activateSafeMode(riskScore: number) {
    await walletClient.writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'activateSafeMode',
        args: [riskScore]
    })
}
```

Boom.

Autonomous defensive protocol.

---

# 🎥 PART 4 — DEMO SCENARIO SCRIPT

## Step 1 — Normal Operation

* Deposit 5 ETH
* Withdraw 0.5 ETH
* Risk ~12
* UI green

---

## Step 2 — Attack Simulation

Withdraw 3 ETH out of 5 total.

Risk jumps to 90+.

Immediately:

* Safe mode activates
* Withdrawals blocked
* UI turns red
* Explanation panel shows reason

---

# 🖥 PART 5 — FRONTEND DASHBOARD

Display:

* Total Liquidity
* Latest Withdrawal
* Risk Score
* Safe Mode Status
* AI Explanation

---

## Optional Enhancement

Add:

```typescript
function generateExplanation(percentage, riskScore) {
    return `
    Withdrawal equals ${percentage.toFixed(2)}% of liquidity.
    This exceeds safe threshold.
    Risk Score: ${riskScore}/100.
    Contract entered Safe Mode automatically.
    `
}
```

Judges LOVE readable reasoning.

---

# 🔥 OPTIONAL UPGRADE — BLOCK TICK MONITORING

You can subscribe to:

```solidity
BlockTick(uint64 blockNumber)
```

Use this to:

* Track withdrawal frequency
* Detect rapid bursts
* Increase risk score

This makes it look even more AI-like.

---

# 🏆 HACKATHON JUDGING ALIGNMENT

### Technical Excellence

✔ Uses Reactivity SDK
✔ Uses atomic state delivery
✔ Autonomous execution

### Real-Time UX

✔ Immediate Safe Mode activation
✔ No polling

### Somnia Integration

✔ Deployed on testnet
✔ Pure push model

### Potential Impact

✔ Reusable guardian layer
✔ Pluggable security module

---

# 📂 Suggested GitHub Structure

```
/contracts
  ReactiveVault.sol

/backend
  index.ts
  riskEngine.ts
  reactivity.ts

/frontend
  pages/
  components/
```

---

# 🧠 README Narrative (Important)

Position it as:

> “An AI-powered autonomous security layer leveraging Somnia’s native push-based Reactivity to create self-defensive smart contracts.”

Use words like:

* Autonomous
* Atomic state consistency
* Real-time defensive automation
* On-chain adaptive control

Judges notice framing.

---

# 🛡 FINAL SYSTEM BEHAVIOR

1. Event emitted
2. Reactivity pushes event + state
3. AI computes anomaly
4. Contract reacts instantly
5. UI reflects change

Zero polling.
Zero cron jobs.
Zero race conditions.