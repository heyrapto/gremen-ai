"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Activity, AlertTriangle, FileClock, Settings } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-[#1a1a1a] flex flex-col h-full bg-[#0d0d0d] font-sans">
            <div className="p-6 border-b border-[#1a1a1a]">
                <h1 className="text-2xl font-display tracking-tight text-white uppercase font-bold">Gremen AI</h1>
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
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a] rounded-md transition text-sm">
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                        <span className="ml-auto text-[10px] bg-[#1a1a1a] text-zinc-500 px-2 py-0.5 rounded-full font-mono">5</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-md transition text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        Vault Runs
                        <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">12</span>
                    </Link>
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a] rounded-md transition text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Anomalies
                    </Link>
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a] rounded-md transition text-sm">
                        <FileClock className="w-4 h-4" />
                        Audit Log
                    </Link>
                </nav>

                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-2 mt-8 tracking-wider font-mono">System</p>
                <nav className="flex flex-col gap-1">
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a] rounded-md transition text-sm">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Link>
                </nav>
            </div>

            <div className="p-4 mt-auto">
                <div className="bg-[#111111] border border-[#222] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-black border border-emerald-500/20">AG</div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white font-sans">Admin User</span>
                        <span className="text-[10px] text-emerald-500 font-medium font-mono">Pro Plan</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
