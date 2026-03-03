export function calculateRisk(eventAmount: number, totalLiquidity: number): number {
    if (totalLiquidity === 0) return eventAmount > 0 ? 100 : 0;

    const percentage = (eventAmount / totalLiquidity) * 100;

    let risk = 0;

    // Weight 1 — Liquidity impact
    risk += percentage * 1.2;

    // Weight 2 — Large transaction multiplier
    if (percentage > 30) risk += 25;
    if (percentage > 50) risk += 40;

    return Math.min(100, risk);
}
