import { describe, expect, it } from "vitest";
import {
  canUseTool,
  FREE_TOOL_IDS,
  PAID_TOOL_IDS,
  readUnlockedFlag,
  restoreUnlockFlag,
  toolRequiresUnlock,
  UNLOCK_PRICE_AUD,
  UNLOCK_STORAGE_KEY,
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
  it("keeps triangle and running free", () => {
    expect(FREE_TOOL_IDS).toEqual(["triangle", "running"]);
    expect(toolRequiresUnlock("triangle")).toBe(false);
    expect(toolRequiresUnlock("running")).toBe(false);
    expect(canUseTool("triangle", false)).toBe(true);
    expect(canUseTool("running", false)).toBe(true);
  });

  it("gates stairs and concrete until unlock", () => {
    expect(PAID_TOOL_IDS).toEqual(["stairs", "concrete"]);
    expect(toolRequiresUnlock("stairs")).toBe(true);
    expect(toolRequiresUnlock("concrete")).toBe(true);
    expect(canUseTool("stairs", false)).toBe(false);
    expect(canUseTool("concrete", false)).toBe(false);
    expect(canUseTool("stairs", true)).toBe(true);
    expect(canUseTool("concrete", true)).toBe(true);
  });

  it("is a $9.99 AUD one-time unlock", () => {
    expect(UNLOCK_PRICE_AUD).toBe(9.99);
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

  it("restores from the local flag until store billing is wired", () => {
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
