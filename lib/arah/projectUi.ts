/** Registry project ids hidden in the public UI only (still on-chain). */
export const HIDDEN_PROJECT_IDS = new Set<number>([0]);

export function isProjectHiddenInUi(id: number): boolean {
  return HIDDEN_PROJECT_IDS.has(id);
}
