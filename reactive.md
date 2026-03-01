# What is Reactivity?

Reactivity is Somnia's event-driven paradigm for dApps. It pushes notifications—combining emitted events and related blockchain state—to subscribers in real-time, enabling "reactive" logic without polling.

{% hint style="warning" %}
**Reactivity is currently only available on TESTNET**
{% endhint %}

#### Core Concepts

* **Events**: Triggers from smart contracts (e.g., Transfer, Approval).
* **State**: View calls for contract data fetched at the event's block height.
* **Push Delivery**: Chain validators / nodes handle notifications, invoking handlers or WebSocket callbacks directly.
* **Subscribers**: Off-chain apps (TypeScript) or on-chain contracts (Solidity).

This shifts dApps from reactive querying to proactive responses, like a pub/sub system baked into the blockchain.

# Quickstart

{% hint style="warning" %}
**Reactivity is currently only available on TESTNET**
{% endhint %}

### Off-chain (TypeScript)

#### 📦 SDK Installation

```bash
npm i @somnia-chain/reactivity
```

#### 🔌 Plugging into the SDK

You'll need `viem` installed for the public and or wallet client. Install it with `npm i viem`.

```typescript
import { createPublicClient, createWalletClient, http, defineChain } from 'viem'
import { SDK } from '@somnia-chain/reactivity'

// Example: Public client (required for reading data)
const chain = defineChain() // see viem docs for defining a chain
const publicClient = createPublicClient({
  chain, 
  transport: http(),
})

// Optional: Wallet client for writes
const walletClient = createWalletClient({
  account,
  chain,
  transport: http(),
})

const sdk = new SDK({
  public: publicClient,
  wallet: walletClient, // Omit if not executing transactions on-chain
})
```

#### 📡 Activating Websocket Reactivity Subscriptions

Use WebSocket subscriptions for real-time updates to contract event and state updates atomically. Define params and subscribe — the SDK handles the rest via WebSockets.

```typescript
import { SDK, SubscriptionInitParams, SubscriptionCallback } from '@somnia-chain/reactivity'

const initParams: SubscriptionInitParams = {
  ethCalls: [], // State to read when events are emitted
  onData: (data: SubscriptionCallback) => console.log('Received:', data),
}

const subscription = await sdk.subscribe(initParams)
```

### On-chain (Solidity handlers)

Developers can build Solidity smart contracts that get invoked when other contracts emit events—allowing smart contracts to "react" to what's happening on-chain.

In order to achieve this, we need two things:

1. A Somnia event handler smart contract (standard Solidity syntax).
2. A valid subscription with funds to pay for Solidity handler invocations. Creators of on-chain subscriptions are required to hold minimum balances (currently 32 SOM) that pay for handler invocations executed by validators.

#### Creating the Handler Smart Contract

Very basic contract with the `@somnia-chain/reactivity-contracts` npm package installed

```solidity
pragma solidity ^0.8.20;

import { SomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

contract ExampleEventHandler is SomniaEventHandler {

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // Execute your logic here
        // Be careful about emitting events to avoid infinite loops
    }

}
```

Once the handler is complete, deploy it using Foundry or Hardhat, and note the address — this will be required for creating a subscription.

#### Setting Up an On-Chain Subscription (Using the SDK)

The following uses the TypeScript SDK to create and pay for a subscription that will invoke a handler contract for events emitted by other smart contracts. Another approach would be for the subscribing smart contract to directly hold the required SOM balance and have the logic for creating the subscription baked into one place, but that may not always be optimal.

```typescript
import { SDK } from '@somnia-chain/reactivity';
import { parseGwei } from 'viem';

// Initialize the SDK
const sdk = new SDK({
  public: publicClient,
  wallet: walletClient,
})

// Create a Solidity subscription
// This is an example of a wildcard subscription to all events
// We do not need to supply SOM—the chain ensures min balance
await sdk.createSoliditySubscription({
  handlerContractAddress: '0x123...',
  priorityFeePerGas: parseGwei('2'),   // 2 gwei — minimum recommended for validators to process
  maxFeePerGas: parseGwei('10'),        // 10 gwei — max you're willing to pay (base + priority)
  gasLimit: 500_000n,                   // Adjust based on handler complexity (up to 3M for complex logic)
  isGuaranteed: true,
  isCoalesced: false,
});
```

# Subscriptions: The Core Primitive

Subscriptions are configurable listeners that define what events to watch and how to deliver notifications. They're the foundation of reactivity—create one, and the chain does the rest.

#### Key Features

* **Filters**: Wildcard (\*) for all events, or specify emitters, topics.
* **On-chain**
  * **Costs**: Minimum 32 SOM balance to cover handler invocation costs on-chain (validators execute handlers) + small amount of gas (\~21K) to create each subscription
  * **Options**:
    * isGuaranteed: Eventual delivery with some block inclusion distance (true/false).
    * isCoalesced: Batch multiple events into one notification within a block.
    * Handler Gas params: priorityFeePerGas, maxFeePerGas, gasLimit
* **Off-chain**&#x20;
  * **Costs**: Cost of running the Somnia node or paying an RPC provider

# Push vs Pull: An Architectural Shift

Traditional EVM dApps "pull" data via polling (e.g., repeated getLogs or state rpc queries), leading to inefficiency and high rpc costs. Somnia Reactivity's "push" model notifies you proactively, transforming app architecture.

#### Highlights

| Aspect     | Pull (Traditional)                 | Push (Somnia Reactivity)          |
| ---------- | ---------------------------------- | --------------------------------- |
| Data Fetch | Poll RPCs periodically             | Passive notifications             |
| Latency    | Seconds to minutes (poll interval) | Near-instant (block time)         |
| RPC Calls  | High (loops, retries)              | Minimal (one sub setup)           |
| Complexity | Manage loops, error handling       | Simple callback/handler           |
| Use Cases  | Basic event listening              | Real-time reactions, auto-updates |

#### Why It Matters

* **Simplified Front-Ends**: No more `setInterval` for balances—push updates UIs directly.
* **Efficient Indexers**: Push to DBs instead of scanning blocks.
* **Cost Savings**: Avoid redundant queries.

Let the chain push changes to you and build realtime blockchain applications

# System Events

There are two events that are generated by the system, this is represented in Solidity as:

```solidity
event BlockTick(uint64 indexed blockNumber);
event Schedule(uint256 indexed timestampMillis);
```

You can subscribe to those events as any other. The system will generate those events for every block and match with any subscriptions.&#x20;

{% hint style="info" %}
Remember to set the `emitter` field to `SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS`. This will make sure that your handler will only respond to system events.
{% endhint %}

### Block Tick Event

If `blockNumber` is provided then this event will trigger at the specific block. Other wise this will be triggered at every block, \~10 times per second.

This example will tick at every single block:

```solidity
ISomniaReactivityPrecompile.SubscriptionData
    memory subscriptionData = ISomniaReactivityPrecompile
        .SubscriptionData({
            eventTopics: [BlockTick.selector, bytes32(0), bytes32(0), bytes32(0)],
            emitter: SomniaExtensions.SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS,
            handlerContractAddress: address(this),
            handlerFunctionSelector: ISomniaEventHandler.onEvent.selector,
            /*...*/
    });
```

### Schedule Event

This event is useful for scheduling actions in the future. Few things to remember:

* The provided timestamp must be in the future, minimum is next second from the current block
* The subscription to `Schedule` is one-off and will be deleted after triggering
* The timestamp is expressed in milliseconds (see <https://currentmillis.com/> for handy calculations)

his example will tick on Nov 11 2026 11:11:11.011 :

```solidity
ISomniaReactivityPrecompile.SubscriptionData
    memory subscriptionData = ISomniaReactivityPrecompile
        .SubscriptionData({
            eventTopics: [Schedule.selector, 1794395471011, bytes32(0), bytes32(0)],
            emitter: SomniaExtensions.SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS,
            handlerContractAddress: address(this),
            handlerFunctionSelector: ISomniaEventHandler.onEvent.selector,
            /*...*/
    });
```

# State Consistency Guarantees

Somnia ensures notifications deliver events and state that are consistent—sourced from the exact same block. This eliminates race conditions common in pull models.

#### How It Works

* **Atomic Delivery**: Event + state (via ETH calls) processed in one validator-executed bundle.
* **Guarantees**:
  * Non-coalesced: One notification per event.
  * Coalesced: Batched, but state reflects the latest in the batch.

#### Example Impact

In a DeFi app, a "Transfer" event pushes the new balance immediately—no extra balanceOf call needed.

This makes dApps more reliable and easier to reason about.

# No, this is not like regular EVM event subscriptions

Think event subscriptions are old news? On Ethereum or other EVM chains, they're just events, no state, and no on-chain reactions. Somnia's push subscriptions deliver state along side event data, something other EVMs cannot offer.

#### Chain Comparison

* **Other Chains**: `eth_subscribe` gives events only—you still pull state separately, risking inconsistency.
* **Somnia**: Pushes event + state atomically; invokes Solidity handlers directly.

#### Code Comparison

**Ethereum (Pull)**:

```javascript
web3.eth.subscribe('logs', { address: '0x...' }, (err, log) => {
  // Now pull state manually
  contract.methods.balanceOf(...).call();
});
```

**Somnia (Push)**:

```typescript
sdk.subscribe({ ethCalls: ['balanceOf'], onData: (data) => {
  // Event + state delivered with `data`
});
```