export function calculateRisk(eventAmount: number, totalLiquidity: number): number {
    if (totalLiquidity === 0) return eventAmount > 0 ? 100 : 0;

    const percentage = (eventAmount / totalLiquidity) * 100;

    let risk = 0;

    // Weight 1 — Liquidity impact
    risk += percentage * 1.2;

    // Demo-optimized logic: Any withdrawal over 1 STT is treated as high riskks
    if (eventAmount >= 1) risk += 90;
    if (percentage > 50) risk += 40;

    return Math.min(100, risk);
}
