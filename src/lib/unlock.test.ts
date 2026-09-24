import { describe, expect, it } from "vitest";
import {
  canUseTool,
  consumeFreeUse,
  emptyFreeUseCounts,
  FREE_TOOL_IDS,
  FREE_USES_PER_PAID_TOOL,
  FREE_USES_STORAGE_KEY,
  freeUsesRemaining,
  hasFreeUseRemaining,
  PAID_TOOL_IDS,
  paidToolHomeLabel,
  readFreeUsesConsumed,
  readUnlockedFlag,
  restoreUnlockFlag,
  toolRequiresUnlock,
  UNLOCK_PRICE_AUD,
  UNLOCK_PRICE_LABEL,
  UNLOCK_STORAGE_KEY,
  writeFreeUsesConsumed,
  writeUnlockedFlag,
  type UnlockStorage,
} from "./unlock.ts";

function memoryStorage(initial: Record<string, string> = {}): UnlockStorage {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

describe("unlock gate", () => {
  it("keeps triangle and running free forever", () => {
    const consumed = { stairs: 1, concrete: 1 };
    expect(FREE_TOOL_IDS).toEqual(["triangle", "running"]);
    expect(toolRequiresUnlock("triangle")).toBe(false);
    expect(toolRequiresUnlock("running")).toBe(false);
    expect(canUseTool("triangle", false)).toBe(true);
    expect(canUseTool("running", false)).toBe(true);
    expect(canUseTool("triangle", false, consumed)).toBe(true);
    expect(canUseTool("running", false, consumed)).toBe(true);
    expect(paidToolHomeLabel("triangle", false, consumed)).toBeNull();
    expect(paidToolHomeLabel("running", false, consumed)).toBeNull();
  });

  it("gives stairs and concrete one free calculation each while locked", () => {
    expect(PAID_TOOL_IDS).toEqual(["stairs", "concrete"]);
    expect(FREE_USES_PER_PAID_TOOL).toBe(1);
    expect(toolRequiresUnlock("stairs")).toBe(true);
    expect(toolRequiresUnlock("concrete")).toBe(true);

    const unused = emptyFreeUseCounts();
    expect(canUseTool("stairs", false, unused)).toBe(true);
    expect(canUseTool("concrete", false, unused)).toBe(true);
    expect(hasFreeUseRemaining("stairs", unused)).toBe(true);
    expect(hasFreeUseRemaining("concrete", unused)).toBe(true);
    expect(paidToolHomeLabel("stairs", false, unused)).toBe("try-once");
    expect(paidToolHomeLabel("concrete", false, unused)).toBe("try-once");
  });

  it("gates a paid tool after its own free use is consumed", () => {
    const stairsUsed = { stairs: 1, concrete: 0 };
    expect(canUseTool("stairs", false, stairsUsed)).toBe(false);
    expect(canUseTool("concrete", false, stairsUsed)).toBe(true);
    expect(freeUsesRemaining("stairs", stairsUsed)).toBe(0);
    expect(freeUsesRemaining("concrete", stairsUsed)).toBe(1);
    expect(paidToolHomeLabel("stairs", false, stairsUsed)).toBe("unlock");
    expect(paidToolHomeLabel("concrete", false, stairsUsed)).toBe("try-once");

    const bothUsed = { stairs: 1, concrete: 1 };
    expect(canUseTool("stairs", false, bothUsed)).toBe(false);
    expect(canUseTool("concrete", false, bothUsed)).toBe(false);
    expect(paidToolHomeLabel("stairs", false, bothUsed)).toBe("unlock");
    expect(paidToolHomeLabel("concrete", false, bothUsed)).toBe("unlock");
  });

  it("lets the one-time unlock clear the gate for both paid tools", () => {
    const bothUsed = { stairs: 1, concrete: 1 };
    expect(canUseTool("stairs", true, bothUsed)).toBe(true);
    expect(canUseTool("concrete", true, bothUsed)).toBe(true);
    expect(paidToolHomeLabel("stairs", true, bothUsed)).toBeNull();
    expect(paidToolHomeLabel("concrete", true, bothUsed)).toBeNull();
  });

  it("falls back to the Australian list price, never $5.99", () => {
    expect(UNLOCK_PRICE_AUD).toBe(9.99);
    expect(UNLOCK_PRICE_LABEL).toBe("A$9.99");
    expect(UNLOCK_PRICE_LABEL).not.toContain("5.99");
  });

  it("persists a local unlock flag", () => {
    const storage = memoryStorage();
    expect(readUnlockedFlag(storage)).toBe(false);
    writeUnlockedFlag(true, storage);
    expect(storage.getItem(UNLOCK_STORAGE_KEY)).toBe("1");
    expect(readUnlockedFlag(storage)).toBe(true);
    writeUnlockedFlag(false, storage);
    expect(readUnlockedFlag(storage)).toBe(false);
  });

  it("persists per-tool free-use counts independently", () => {
    const storage = memoryStorage();
    expect(readFreeUsesConsumed(storage)).toEqual({ stairs: 0, concrete: 0 });

    expect(consumeFreeUse("stairs", storage)).toBe(true);
    expect(storage.getItem(FREE_USES_STORAGE_KEY)).toBe(JSON.stringify({ stairs: 1, concrete: 0 }));
    expect(readFreeUsesConsumed(storage)).toEqual({ stairs: 1, concrete: 0 });
    expect(canUseTool("stairs", false, readFreeUsesConsumed(storage))).toBe(false);
    expect(canUseTool("concrete", false, readFreeUsesConsumed(storage))).toBe(true);

    expect(consumeFreeUse("stairs", storage)).toBe(false);
    expect(readFreeUsesConsumed(storage)).toEqual({ stairs: 1, concrete: 0 });

    expect(consumeFreeUse("concrete", storage)).toBe(true);
    expect(readFreeUsesConsumed(storage)).toEqual({ stairs: 1, concrete: 1 });
    expect(canUseTool("concrete", false, readFreeUsesConsumed(storage))).toBe(false);
    expect(canUseTool("stairs", true, readFreeUsesConsumed(storage))).toBe(true);
    expect(canUseTool("concrete", true, readFreeUsesConsumed(storage))).toBe(true);
  });

  it("treats invalid stored free-use JSON as unused", () => {
    const storage = memoryStorage({ [FREE_USES_STORAGE_KEY]: "not-json" });
    expect(readFreeUsesConsumed(storage)).toEqual({ stairs: 0, concrete: 0 });
    writeFreeUsesConsumed({ stairs: 9, concrete: -2 }, storage);
    expect(readFreeUsesConsumed(storage)).toEqual({ stairs: 1, concrete: 0 });
  });

  it("restores from the local flag for the web/debug stub", () => {
    const empty = memoryStorage();
    expect(restoreUnlockFlag(empty)).toEqual({
      unlocked: false,
      message: "No purchase found on this device.",
    });
    const paid = memoryStorage({ [UNLOCK_STORAGE_KEY]: "1" });
    expect(restoreUnlockFlag(paid)).toEqual({
      unlocked: true,
      message: "Unlock restored on this device.",
    });
  });
});
