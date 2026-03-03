import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, defineChain, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK } from '@somnia-chain/reactivity';
import { VAULT_ABI } from '@/lib/abi';
import { calculateRisk } from '@/lib/riskEngine';

// Global scope to hold the SDK instance in dev/prod Serverless
declare global {
    var guardianSubscribed: boolean;
}

// In-memory store for frontend to fetch recent events
export const recentEvents: any[] = [];
export let currentRiskScore: number = 0;
export let currentSafeMode: boolean = false;

// Mock chain logic for testnet/local anvil
const chain = defineChain({
    id: 31337, // local anvil
    name: 'Localhost',
    network: 'localhost',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
// Anvil Account #0 private key default for the Guardian bot
const GUARDIAN_PK = process.env.GUARDIAN_PRIVATE_KEY as `0x${string}` || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const account = privateKeyToAccount(GUARDIAN_PK);

const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });

const sdk = new SDK({
    public: publicClient as any,
    wallet: walletClient as any,
});

async function handleEvent(data: any) {
    const event = data.event;
    // Fallbacks if data fails locally
    const totalLiquidity = data.ethCallResults?.[0] ? Number(data.ethCallResults[0]) : 0;
    const isSafeMode = data.ethCallResults?.[1] ? Boolean(data.ethCallResults[1]) : false;

    currentSafeMode = isSafeMode;

    if (event.name !== "Withdraw") {
        // Just log deposit
        recentEvents.unshift({
            id: Math.random().toString(),
            type: "Deposit",
            amount: Number(event.args.amount) / 1e18,
            risk: 0,
            timestamp: new Date().toISOString(),
            status: "success"
        });
        return;
    }

    const amountStr = event.args.amount ? Number(event.args.amount) : 0;
    const decodedAmount = amountStr / 1e18;
    const decodedLiquidity = totalLiquidity / 1e18;

    const riskScore = calculateRisk(decodedAmount, decodedLiquidity);
    currentRiskScore = riskScore;

    recentEvents.unshift({
        id: Math.random().toString(),
        type: "Withdraw",
        amount: decodedAmount,
        risk: riskScore,
        timestamp: new Date().toISOString(),
        status: riskScore > 80 ? "failed" : "success"
    });

    console.log(`[Guardian] Withdraw detected! Amount: ${decodedAmount} | Liquidity: ${decodedLiquidity} | Risk: ${riskScore}`);

    if (riskScore > 80 && !isSafeMode) {
        console.log(`[Guardian] 🚨 HIGH RISK! Activating Safe Mode...`);
        try {
            const tx = await walletClient.writeContract({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'activateSafeMode',
                args: [BigInt(Math.floor(riskScore))],
            });
            console.log(`[Guardian] Safe Mode Activated! TX:`, tx);
            currentSafeMode = true;
        } catch (err) {
            console.error("[Guardian] Failed to activate safe mode", err);
        }
    }
}

async function startSubscription() {
    if (global.guardianSubscribed) return;

    if (!VAULT_ADDRESS) {
        console.error("[Guardian] Missing VAULT_ADDRESS. Guardian skip block.");
        return;
    }

    console.log("[Guardian] Initializing Reactivity Subscription...");

    const initParams = {
        ethCalls: [
            {
                address: VAULT_ADDRESS,
                abi: VAULT_ABI, // Using strictly typed ABI 
                functionName: 'totalLiquidity',
            },
            {
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'safeMode',
            }
        ],
        onData: async (data: any) => {
            await handleEvent(data);
        },
    };

    try {
        // Wait for subscription to establish successfully
        await sdk.subscribe(initParams as any);
        global.guardianSubscribed = true;
        console.log("[Guardian] Subscribed successfully to Reactivity.");
    } catch (e) {
        console.error("[Guardian] Reactivity err", e);
    }
}

export async function GET(req: NextRequest) {
    // Check parameter
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'start') {
        await startSubscription();
        return NextResponse.json({ success: true, message: "Subscription verified running" });
    }

    // default poll logic for frontend
    return NextResponse.json({
        events: recentEvents.slice(0, 10),
        currentRiskScore,
        currentSafeMode
    });
}
