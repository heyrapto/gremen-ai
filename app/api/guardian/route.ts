import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, defineChain, parseEther, encodeFunctionData, decodeEventLog } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SDK } from '@somnia-chain/reactivity';
import { VAULT_ABI } from '@/lib/abi';
import { calculateRisk } from '@/lib/riskEngine';

// Global scope for dev persistence
declare global {
    var guardianSubscribed: boolean;
    var guardianUnwatch: (() => void) | undefined;
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
    rpcUrls: {
        default: {
            http: ['http://127.0.0.1:8545'],
            webSocket: ['ws://127.0.0.1:8545']
        }
    },
});

function getVaultAddress() {
    return (process.env.NEXT_PUBLIC_VAULT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;
}
const GUARDIAN_PK = (process.env.GUARDIAN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`;

const account = privateKeyToAccount(GUARDIAN_PK);

const publicClient = createPublicClient({ chain, transport: http() });
const walletClient = createWalletClient({ account, chain, transport: http() });

async function handleEvent(data: any) {
    if (!data.result) return;

    const { topics, data: logData, simulationResults } = data.result;

    // Decode the event using the ABI
    let eventName: string = "";
    let eventArgs: any = {};

    try {
        const decoded = decodeEventLog({
            abi: VAULT_ABI as any,
            data: logData,
            topics: topics,
        }) as any;
        eventName = decoded.eventName;
        eventArgs = decoded.args;
        console.log(`[Guardian] handleEvent triggered for ${eventName}`);
    } catch (e) {
        console.error("[Guardian] Failed to decode event log", e);
        return;
    }

    const totalLiquidity = simulationResults?.[0] ? BigInt(simulationResults[0]) : BigInt(0);
    const isSafeMode = simulationResults?.[1] ? Number(simulationResults[1]) === 1 : false;

    currentSafeMode = isSafeMode;

    if (eventName !== "Withdraw") {
        recentEvents.unshift({
            id: Math.random().toString(),
            type: eventName,
            amount: eventArgs.amount ? Number(eventArgs.amount) / 1e18 : 0,
            risk: 0,
            timestamp: new Date().toISOString(),
            status: "success"
        });
        return;
    }

    const amountStr = eventArgs.amount ? Number(eventArgs.amount) : 0;
    const decodedAmount = amountStr / 1e18;
    const decodedLiquidity = Number(totalLiquidity) / 1e18;

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

    const address = getVaultAddress();
    console.log(`[Guardian] Withdraw detected! Amount: ${decodedAmount} | Liquidity: ${decodedLiquidity} | Risk: ${riskScore}`);

    if (riskScore > 80 && !isSafeMode) {
        console.log(`[Guardian] 🚨 HIGH RISK! Activating Safe Mode...`);
        try {
            const tx = await walletClient.writeContract({
                address: address,
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
    // If an existing watcher is running, stop it first to prevent duplicates
    if (global.guardianUnwatch) {
        console.log("[Guardian] Stopping existing watcher before restart...");
        global.guardianUnwatch();
        global.guardianUnwatch = undefined;
    }

    const address = getVaultAddress();
    if (!address) {
        console.error("[Guardian] Missing VAULT_ADDRESS. Guardian skip block.");
        return;
    }

    console.log(`[Guardian] Initializing Reactivity Subscription (Anvil Fallback) for ${address}...`);

    try {
        const unwatch = publicClient.watchContractEvent({
            address: address,
            abi: VAULT_ABI,
            onLogs: async (logs) => {
                for (const logItem of logs) {
                    console.log(`[Guardian] New Log detected: ${logItem.eventName}`);

                    const [totalLiquidity, safeMode] = await Promise.all([
                        publicClient.readContract({
                            address: address,
                            abi: VAULT_ABI,
                            functionName: 'totalLiquidity',
                        }),
                        publicClient.readContract({
                            address: address,
                            abi: VAULT_ABI,
                            functionName: 'safeMode',
                        })
                    ]);

                    const data = {
                        result: {
                            topics: logItem.topics,
                            data: logItem.data,
                            simulationResults: [
                                totalLiquidity.toString(),
                                safeMode ? "1" : "0"
                            ]
                        }
                    };
                    await handleEvent(data);
                }
            }
        });

        global.guardianUnwatch = unwatch;
        global.guardianSubscribed = true;
        console.log("[Guardian] Subscription set up. Watching for events at", address);
    } catch (e: any) {
        console.error(`[Guardian] Subscription setup failed: ${e.message}`);
    }
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'start' || action === 'reset') {
        if (action === 'reset') {
            recentEvents.length = 0;
            currentRiskScore = 0;
            currentSafeMode = false;
        }
        await startSubscription();
        return NextResponse.json({ success: true, message: action === 'reset' ? "State reset and subscription restarted" : "Subscription verified running" });
    }

    return NextResponse.json({
        events: recentEvents.slice(0, 10),
        currentRiskScore,
        currentSafeMode
    });
}
