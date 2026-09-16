/** One-time non-consumable IAP for stairs + concrete. */
export const UNLOCK_PRODUCT_ID = "tradies_toolbox_setout_unlock";

export const UNLOCK_STORAGE_KEY = "tradies-toolbox.unlock.v1";

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

export type UnlockStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function toolRequiresUnlock(id: ToolId): boolean {
  return (PAID_TOOL_IDS as readonly ToolId[]).includes(id);
}

export function canUseTool(id: ToolId, unlocked: boolean): boolean {
  return !toolRequiresUnlock(id) || unlocked;
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
