/** One-time non-consumable IAP for stairs + concrete. */
export const UNLOCK_PRODUCT_ID = "tradies_toolbox_setout_unlock";

export const UNLOCK_STORAGE_KEY = "tradies-toolbox.unlock.v1";

/** Consumed free-calculation counts for paid tools. Same localStorage style as the unlock flag. */
export const FREE_USES_STORAGE_KEY = "tradies-toolbox.free-uses.v1";

export const FREE_USES_PER_PAID_TOOL = 1;

export const UNLOCK_PRICE_AUD = 9.99;
export const UNLOCK_PRICE_LABEL = "$9.99 AUD";

/** Play Billing / StoreKit product type: managed one-time (non-consumable). */
export const UNLOCK_PRODUCT_TYPE = "inapp";

export const PUBLIC_PRIVACY_URL =
  "https://josh12891.github.io/chippys-toolbox/privacy.html";

export type ToolId = "concrete" | "stairs" | "running" | "triangle";

export const FREE_TOOL_IDS = ["triangle", "running"] as const satisfies readonly ToolId[];
export const PAID_TOOL_IDS = ["stairs", "concrete"] as const satisfies readonly ToolId[];

export type PaidToolId = (typeof PAID_TOOL_IDS)[number];

export type FreeUseCounts = Record<PaidToolId, number>;

export type PaidToolHomeLabel = "try-once" | "unlock" | null;

export type UnlockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function isPaidToolId(id: ToolId): id is PaidToolId {
  return (PAID_TOOL_IDS as readonly ToolId[]).includes(id);
}

export function toolRequiresUnlock(id: ToolId): boolean {
  return isPaidToolId(id);
}

export function emptyFreeUseCounts(): FreeUseCounts {
  return { stairs: 0, concrete: 0 };
}

export function freeUsesRemaining(id: PaidToolId, consumed: FreeUseCounts): number {
  return Math.max(0, FREE_USES_PER_PAID_TOOL - (consumed[id] ?? 0));
}

export function hasFreeUseRemaining(id: PaidToolId, consumed: FreeUseCounts): boolean {
  return freeUsesRemaining(id, consumed) > 0;
}

/**
 * Whether this tool may run a calculation now.
 * Triangle + running are free forever. Stairs + concrete each get one free
 * real calculation; after that they need the one-time unlock (which covers both).
 */
export function canUseTool(
  id: ToolId,
  unlocked: boolean,
  consumed: FreeUseCounts = emptyFreeUseCounts(),
): boolean {
  if (!isPaidToolId(id) || unlocked) return true;
  return hasFreeUseRemaining(id, consumed);
}

export function paidToolHomeLabel(
  id: ToolId,
  unlocked: boolean,
  consumed: FreeUseCounts,
): PaidToolHomeLabel {
  if (!isPaidToolId(id) || unlocked) return null;
  return hasFreeUseRemaining(id, consumed) ? "try-once" : "unlock";
}

function browserStorage(): UnlockStorage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readUnlockedFlag(storage: UnlockStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeUnlockedFlag(
  value: boolean,
  storage: UnlockStorage | null = browserStorage(),
): void {
  if (!storage) return;
  try {
    if (value) storage.setItem(UNLOCK_STORAGE_KEY, "1");
    else storage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    // Private mode / quota — treat as still locked.
  }
}

export function readFreeUsesConsumed(
  storage: UnlockStorage | null = browserStorage(),
): FreeUseCounts {
  const empty = emptyFreeUseCounts();
  if (!storage) return empty;
  try {
    const raw = storage.getItem(FREE_USES_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<FreeUseCounts>;
    return {
      stairs: clampConsumed(parsed.stairs),
      concrete: clampConsumed(parsed.concrete),
    };
  } catch {
    return empty;
  }
}

export function writeFreeUsesConsumed(
  counts: FreeUseCounts,
  storage: UnlockStorage | null = browserStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      FREE_USES_STORAGE_KEY,
      JSON.stringify({
        stairs: clampConsumed(counts.stairs),
        concrete: clampConsumed(counts.concrete),
      }),
    );
  } catch {
    // Private mode / quota — treat as not persisted.
  }
}

/**
 * Consume one free calculation for a paid tool. Returns true when this call
 * used the remaining free shot. IAP unlock does not need to clear these
 * counters — `canUseTool` ignores them once unlocked.
 */
export function consumeFreeUse(
  id: PaidToolId,
  storage: UnlockStorage | null = browserStorage(),
): boolean {
  const current = readFreeUsesConsumed(storage);
  if (!hasFreeUseRemaining(id, current)) return false;
  writeFreeUsesConsumed({ ...current, [id]: current[id] + 1 }, storage);
  return true;
}

export function restoreUnlockFlag(storage: UnlockStorage | null = browserStorage()): {
  unlocked: boolean;
  message: string;
} {
  const unlocked = readUnlockedFlag(storage);
  return {
    unlocked,
    message: unlocked
      ? "Unlock restored on this device."
      : "No purchase found on this device.",
  };
}

function clampConsumed(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(FREE_USES_PER_PAID_TOOL, Math.floor(n));
}
