"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, Loader2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { VAULT_ABI } from '@/lib/abi';

const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;

type EventType = {
  id: string;
  type: string;
  amount: number;
  risk: number;
  timestamp: string;
  status: "success" | "failed";
};

type DashboardData = {
  events: EventType[];
  currentRiskScore: number;
  currentSafeMode: boolean;
};

export default function Home() {
  const [data, setData] = useState<DashboardData>({ events: [], currentRiskScore: 0, currentSafeMode: false });
  const [loading, setLoading] = useState(true);
  const { writeContractAsync, isPending } = useWriteContract();

  const handleDeposit = async () => {
    try {
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'deposit',
        value: parseEther('5')
      });
    } catch (err: any) {
      console.error("Deposit failed:", err);
      alert(`Deposit failed: ${err.shortMessage || err.message || "Unknown error"}`);
    }
  };

  const handleWithdraw = async (amount: string) => {
    try {
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)]
      });
    } catch (err: any) {
      console.error("Withdraw failed:", err);
      alert(`Withdraw failed: ${err.shortMessage || err.message || "Unknown error"}`);
    }
  };

  const fetchData = async () => {
    try {
      const fetchRes = await fetch("/api/guardian");
      const result = await fetchRes.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start backend subscription
    fetch("/api/guardian?action=start").catch(console.error);

    // Poll for frontend updates
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalRuns = data.events.length;
  const successfulRuns = data.events.filter((e) => e.status === "success").length;
  const failedRuns = data.events.filter((e) => e.status === "failed").length;

  return (
    <div className="flex-1 p-8 overflow-y-auto relative z-10 w-full max-w-6xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-display text-white uppercase tracking-wider mb-1">
            VAULT RUNS
          </h2>
          <p className="text-zinc-500 font-mono text-xs tracking-wider">
            Monitor ReactiveVault execution and risk anomalies in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleDeposit()} disabled={isPending} className="flex items-center gap-2 px-2 py-2 bg-emerald-500 text-black font-bold text-sm rounded-lg hover:bg-emerald-400 transition ml-4 disabled:opacity-50 cursor-pointer">
            <Zap className="w-4 h-4" /> Deposit 1 STT
          </button>
          {/* <button onClick={() => handleWithdraw("0.5")} disabled={isPending} className="px-2 py-2 bg-[#1a1a1a] text-zinc-300 font-bold text-sm rounded-lg border border-[#222] hover:bg-[#222] transition disabled:opacity-50 cursor-pointer">
            Withdraw 0.5 STT
          </button> */}
          <button onClick={() => handleWithdraw("3")} disabled={isPending} className="px-2 py-2 bg-red-500/10 text-red-500 font-bold text-sm rounded-lg border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50 cursor-pointer">
            Attack (Withdraw 3 STT)
          </button>

          <button
            onClick={fetchData}
            title="Refresh Events"
            className="flex items-center justify-center w-10 h-10 bg-[#1a1a1a] border border-[#222] hover:bg-[#222] hover:border-[#333] transition rounded-lg text-zinc-300 ml-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111111]/80 backdrop-blur-md border border-[#222] rounded-xl p-5 shadow-2xl">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
            Total Events
          </p>
          <div className="text-3xl font-black text-white">{totalRuns}</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 border-t-2 border-t-emerald-500 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition"></div>
          <p className="text-xs font-mono text-emerald-500/70 uppercase tracking-widest mb-3">
            Successful
          </p>
          <div className="text-3xl font-black text-emerald-400">{successfulRuns}</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-5 border-t-2 border-t-red-500 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition"></div>
          <p className="text-xs font-mono text-red-500/70 uppercase tracking-widest mb-3">
            Blocked (Risk {">"} 80)
          </p>
          <div className="text-3xl font-black text-red-400">{failedRuns}</div>
        </div>
        <div className={`bg-[#111] border border-[#222] rounded-xl p-5 border-t-2 shadow-2xl relative overflow-hidden group ${data.currentSafeMode ? 'border-t-red-500' : 'border-t-emerald-500'}`}>
          <div className={`absolute inset-0 transition ${data.currentSafeMode ? 'bg-red-500/10' : 'bg-emerald-500/5'}`}></div>
          <p className={`text-xs font-mono uppercase tracking-widest mb-3 ${data.currentSafeMode ? 'text-red-500/70' : 'text-emerald-500/70'}`}>
            Safe Mode Status
          </p>
          <div className={`text-xl font-bold flex items-center gap-2 ${data.currentSafeMode ? 'text-red-400' : 'text-emerald-400'}`}>
            {data.currentSafeMode ? (
              <><AlertTriangle className="w-6 h-6" /> ACTIVE</>
            ) : (
              <><ShieldCheck className="w-6 h-6" /> INACTIVE</>
            )}
          </div>
        </div>
      </div>

      {/* Filters (Mocked logic for UI) */}
      <div className="flex gap-3 mb-4">
        <select disabled className="bg-[#111] border border-[#222] text-zinc-400 text-sm rounded-lg px-3 py-2 outline-none appearance-none min-w-[120px]">
          <option>All Status</option>
        </select>
        <select disabled className="bg-[#111] border border-[#222] text-zinc-400 text-sm rounded-lg px-3 py-2 outline-none appearance-none min-w-[120px]">
          <option>All Events</option>
        </select>
        <select disabled className="bg-[#111] border border-[#222] text-zinc-400 text-sm rounded-lg px-3 py-2 outline-none appearance-none min-w-[140px]">
          <option>Last 24 hours</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-[#111111]/90 backdrop-blur-md border border-[#222] rounded-xl flex-1 flex flex-col overflow-hidden shadow-2xl">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-4 border-b border-[#222] text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-[#0a0a0a]/50">
          <div className="w-8 flex justify-center"></div>
          <div>Event Type</div>
          <div className="text-right w-24">Amount</div>
          <div className="text-right w-24">Risk Score</div>
          <div className="text-right w-32">Time</div>
          <div className="text-center w-24">Trigger</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 font-sans">
          {data.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm font-mono gap-3">
              <Loader2 className="w-5 h-5 animate-spin opacity-50" />
              Waiting for vault events...
            </div>
          ) : (
            data.events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 p-3 items-center hover:bg-[#1a1a1a] rounded-lg transition group border border-transparent hover:border-[#222]"
              >
                <div className="w-8 flex justify-center">
                  {event.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                    {event.type}
                    <span className="text-[10px] font-mono text-zinc-500 bg-[#000] px-1.5 py-0.5 rounded border border-[#222]">
                      run-{event.id.slice(2, 5)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    ReactiveVault
                  </div>
                </div>

                <div className="text-right text-sm font-mono text-zinc-300 w-24">
                  {event.amount.toFixed(2)} STT
                </div>

                <div className="text-right w-24">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono ${event.risk > 80 ? 'bg-red-500/20 text-red-400' : event.risk > 20 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {event.risk.toFixed(1)}
                  </span>
                </div>

                <div className="text-right text-[11px] text-zinc-500 font-mono w-32 flex items-center justify-end gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>

                <div className="text-center w-24">
                  <span className="text-[10px] font-bold text-zinc-400 bg-[#1a1a1a] border border-[#222] px-2 py-1 rounded-full uppercase tracking-wider">
                    contract
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
