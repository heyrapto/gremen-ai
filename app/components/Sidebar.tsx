"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-[#1a1a1a] flex flex-col h-full bg-[#0d0d0d] font-sans">
            <div className="p-6 border-b border-[#1a1a1a]">
                <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Gremen AI</h1>
            </div>

            <div className="p-4">
                <div className="bg-[#111111] border border-[#222] rounded-md p-3 flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                        V
                    </div>
                    <span className="text-sm font-medium text-zinc-200 cursor-pointer hover:text-white transition font-mono">vault-main</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-2 mt-4 tracking-wider font-mono">Main</p>
                <nav className="flex flex-col gap-1">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-md transition text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        Vault Runs
                        <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">12</span>
                    </Link>
                </nav>
            </div>

            <div className="p-4 mt-auto flex justify-center w-full">
                <div className="scale-90 origin-bottom transform">
                    <ConnectButton showBalance={false} chainStatus="icon" />
                </div>
            </div>
        </aside>
    );
}
