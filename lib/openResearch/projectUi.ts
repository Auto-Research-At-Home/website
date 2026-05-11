/** Registry project ids hidden from the public UI (still on-chain). */
export const HIDDEN_PROJECT_IDS = new Set<bigint>([0n]);

export function isProjectHiddenInUi(id: bigint | number): boolean {
  return HIDDEN_PROJECT_IDS.has(BigInt(id));
}
