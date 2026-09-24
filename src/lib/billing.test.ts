import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  billingFootnote,
  createUnlockBilling,
  formatStorePriceLabel,
  isAlreadyOwnedPurchase,
  isUserCancelledPurchase,
  purchasesGrantUnlock,
  sanitizeUnlockPriceLabel,
  shouldUseLocalUnlockStub,
  transactionGrantsUnlock,
  type NativeBillingClient,
} from "./billing.ts";
import {
  UNLOCK_PRICE_LABEL,
  UNLOCK_PRODUCT_ID,
  UNLOCK_STORAGE_KEY,
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

function fakeClient(overrides: Partial<NativeBillingClient> = {}): NativeBillingClient {
  return {
    isBillingSupported: async () => ({ isBillingSupported: true }),
    getProduct: async () => ({ product: { priceString: "$9.99" } }),
    purchaseProduct: async () => ({
      productIdentifier: UNLOCK_PRODUCT_ID,
      purchaseState: "1",
    }),
    restorePurchases: async () => undefined,
    getPurchases: async () => ({ purchases: [] }),
    ...overrides,
  };
}

describe("transaction entitlement", () => {
  it("accepts a Play Billing purchased state for the set-out product", () => {
    expect(
      transactionGrantsUnlock({
        productIdentifier: UNLOCK_PRODUCT_ID,
        purchaseState: "1",
      }),
    ).toBe(true);
    expect(
      transactionGrantsUnlock({
        productIdentifier: UNLOCK_PRODUCT_ID,
        purchaseState: "PURCHASED",
      }),
    ).toBe(true);
  });

  it("rejects pending, refunded, or other product ids", () => {
    expect(
      transactionGrantsUnlock({
        productIdentifier: UNLOCK_PRODUCT_ID,
        purchaseState: "0",
      }),
    ).toBe(false);
    expect(
      transactionGrantsUnlock({
        productIdentifier: UNLOCK_PRODUCT_ID,
        revocationDate: "2026-09-16T00:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      transactionGrantsUnlock({
        productIdentifier: "something_else",
        purchaseState: "1",
      }),
    ).toBe(false);
    expect(
      purchasesGrantUnlock([
        { productIdentifier: UNLOCK_PRODUCT_ID, purchaseState: "1" },
      ]),
    ).toBe(true);
  });

  it("detects cancel and already-owned billing errors", () => {
    expect(isUserCancelledPurchase({ code: "USER_CANCELLED" })).toBe(true);
    expect(isUserCancelledPurchase({ message: "User cancelled the purchase" })).toBe(
      true,
    );
    expect(isAlreadyOwnedPurchase({ code: "ITEM_ALREADY_OWNED" })).toBe(true);
    expect(isAlreadyOwnedPurchase({ message: "item already owned" })).toBe(true);
  });
});

describe("stub vs store selection", () => {
  it("uses the local stub on web", () => {
    expect(
      shouldUseLocalUnlockStub({ isNative: false, isDev: false, name: "web" }, false),
    ).toBe(true);
  });

  it("uses store billing on native when Play/StoreKit is available", () => {
    expect(
      shouldUseLocalUnlockStub({ isNative: true, isDev: false, name: "android" }, true),
    ).toBe(false);
  });

  it("falls back to the stub on native only in dev when billing is missing", () => {
    expect(
      shouldUseLocalUnlockStub({ isNative: true, isDev: true, name: "android" }, false),
    ).toBe(true);
    expect(
      shouldUseLocalUnlockStub({ isNative: true, isDev: false, name: "android" }, false),
    ).toBe(false);
  });
});

describe("unlock billing adapter", () => {
  it("purchases and restores through the local stub on web", async () => {
    const storage = memoryStorage();
    const billing = createUnlockBilling({
      client: fakeClient(),
      platform: { isNative: false, isDev: true, name: "web" },
      storage,
    });

    expect(await billing.resolveKind()).toBe("stub");
    expect(await billing.getPriceLabel()).toBe(UNLOCK_PRICE_LABEL);
    expect(billingFootnote("stub", "web")).toMatch(/not billed/i);

    const purchased = await billing.purchase();
    expect(purchased.unlocked).toBe(true);
    expect(storage.getItem(UNLOCK_STORAGE_KEY)).toBe("1");
    expect(purchased.message).toMatch(/stub/i);

    const restored = await billing.restore();
    expect(restored).toEqual({
      unlocked: true,
      message: "Unlock restored on this device.",
    });
  });

  it("purchases the Android/iOS product id through the native client", async () => {
    const storage = memoryStorage();
    let purchasedId = "";
    const billing = createUnlockBilling({
      client: fakeClient({
        purchaseProduct: async (options) => {
          purchasedId = options.productIdentifier;
          expect(options.productType).toBe("inapp");
          expect(options.isConsumable).toBe(false);
          return {
            productIdentifier: options.productIdentifier,
            purchaseState: "1",
          };
        },
      }),
      platform: { isNative: true, isDev: false, name: "android" },
      storage,
    });

    expect(await billing.resolveKind()).toBe("store");
    const result = await billing.purchase();
    expect(purchasedId).toBe(UNLOCK_PRODUCT_ID);
    expect(result).toEqual({ unlocked: true, message: "Set-out unlocked." });
    expect(storage.getItem(UNLOCK_STORAGE_KEY)).toBe("1");
  });

  it("restores Android purchases from Play Billing history", async () => {
    const storage = memoryStorage();
    let restored = false;
    const billing = createUnlockBilling({
      client: fakeClient({
        restorePurchases: async () => {
          restored = true;
        },
        getPurchases: async () => ({
          purchases: [
            { productIdentifier: UNLOCK_PRODUCT_ID, purchaseState: "1" },
          ],
        }),
      }),
      platform: { isNative: true, isDev: false, name: "android" },
      storage,
    });

    const result = await billing.restore();
    expect(restored).toBe(true);
    expect(result).toEqual({
      unlocked: true,
      message: "Unlock restored from your store account.",
    });
  });

  it("reports no store purchase without clearing an offline cache on query failure", async () => {
    const storage = memoryStorage({ [UNLOCK_STORAGE_KEY]: "1" });
    const billing = createUnlockBilling({
      client: fakeClient({
        getPurchases: async () => {
          throw new Error("Network");
        },
      }),
      platform: { isNative: true, isDev: false, name: "android" },
      storage,
    });

    const refresh = await billing.refreshFromStore();
    expect(refresh).toEqual({ unlocked: true, queried: false });
    expect(storage.getItem(UNLOCK_STORAGE_KEY)).toBe("1");
  });

  it("locks again when the store query succeeds and the product is gone", async () => {
    const storage = memoryStorage({ [UNLOCK_STORAGE_KEY]: "1" });
    const billing = createUnlockBilling({
      client: fakeClient({
        getPurchases: async () => ({ purchases: [] }),
      }),
      platform: { isNative: true, isDev: false, name: "ios" },
      storage,
    });

    const refresh = await billing.refreshFromStore();
    expect(refresh).toEqual({ unlocked: false, queried: true });
    expect(storage.getItem(UNLOCK_STORAGE_KEY)).toBeNull();
  });

  it("swallows user-cancelled purchases and restores when already owned", async () => {
    const storage = memoryStorage();
    const cancelled = createUnlockBilling({
      client: fakeClient({
        purchaseProduct: async () => {
          throw { code: "USER_CANCELLED", message: "User cancelled" };
        },
      }),
      platform: { isNative: true, isDev: false, name: "android" },
      storage,
    });
    const cancelResult = await cancelled.purchase();
    expect(cancelResult.cancelled).toBe(true);
    expect(cancelResult.unlocked).toBe(false);

    const owned = createUnlockBilling({
      client: fakeClient({
        purchaseProduct: async () => {
          throw { code: "ITEM_ALREADY_OWNED" };
        },
        getPurchases: async () => ({
          purchases: [{ productIdentifier: UNLOCK_PRODUCT_ID, purchaseState: "1" }],
        }),
      }),
      platform: { isNative: true, isDev: false, name: "android" },
      storage,
    });
    const ownedResult = await owned.purchase();
    expect(ownedResult.unlocked).toBe(true);
    expect(ownedResult.message).toMatch(/restored/i);
  });

  it("uses the store price string when the product is listed", async () => {
    let requestedId = "";
    const billing = createUnlockBilling({
      client: fakeClient({
        getProduct: async (options) => {
          requestedId = options.productIdentifier;
          return { product: { priceString: "A$9.99" } };
        },
      }),
      platform: { isNative: true, isDev: false, name: "ios" },
      storage: memoryStorage(),
    });
    expect(await billing.getPriceLabel()).toBe("A$9.99");
    expect(requestedId).toBe(UNLOCK_PRODUCT_ID);
    expect(billingFootnote("store", "android")).toMatch(/Google Play/i);
    expect(billingFootnote("store", "ios")).toMatch(/App Store/i);
  });

  it("keeps a non-AUD StoreKit price string so the button matches that storefront", async () => {
    const billing = createUnlockBilling({
      client: fakeClient({
        getProduct: async () => ({ product: { priceString: "$9.99" } }),
      }),
      platform: { isNative: true, isDev: false, name: "ios" },
      storage: memoryStorage(),
    });
    expect(await billing.getPriceLabel()).toBe("$9.99");
  });

  it("falls back to A$9.99 when StoreKit does not return a price", async () => {
    const billing = createUnlockBilling({
      client: fakeClient({
        getProduct: async () => {
          throw new Error("Product not found");
        },
      }),
      platform: { isNative: true, isDev: false, name: "ios" },
      storage: memoryStorage(),
    });
    expect(await billing.getPriceLabel()).toBe("A$9.99");
    expect(formatStorePriceLabel({ priceString: "  " })).toBe("A$9.99");
    expect(formatStorePriceLabel(null)).toBe("A$9.99");
    expect(formatStorePriceLabel({ priceString: "A$9.99" })).not.toContain("5.99");
  });

  it("replaces a stale 5.99 store label with A$9.99 and keeps 15.99", async () => {
    expect(formatStorePriceLabel({ priceString: "$5.99", identifier: UNLOCK_PRODUCT_ID })).toBe(
      "A$9.99",
    );
    expect(formatStorePriceLabel({ priceString: "A$5.99" })).toBe("A$9.99");
    expect(formatStorePriceLabel({ priceString: "USD 5,99" })).toBe("A$9.99");
    expect(sanitizeUnlockPriceLabel("$5.99")).toBe("A$9.99");
    expect(sanitizeUnlockPriceLabel("$5.99")).not.toMatch(/(?:^|[^\d.])5[.,]99(?!\d)/);
    expect(
      formatStorePriceLabel({ price: 5.99, currencyCode: "USD", identifier: UNLOCK_PRODUCT_ID }),
    ).toBe("A$9.99");
    expect(formatStorePriceLabel({ priceString: "$15.99" })).toBe("$15.99");
    expect(formatStorePriceLabel({ priceString: "A$15.99" })).toBe("A$15.99");
    expect(formatStorePriceLabel({ priceString: "€8.99", identifier: UNLOCK_PRODUCT_ID })).toBe(
      "€8.99",
    );

    const stale = createUnlockBilling({
      client: fakeClient({
        getProduct: async (options) => {
          expect(options.productIdentifier).toBe(UNLOCK_PRODUCT_ID);
          return {
            product: {
              identifier: UNLOCK_PRODUCT_ID,
              priceString: "$5.99",
              price: 5.99,
              currencyCode: "USD",
            },
          };
        },
      }),
      platform: { isNative: true, isDev: false, name: "ios" },
      storage: memoryStorage(),
    });
    expect(await stale.getPriceLabel()).toBe("A$9.99");
  });

  it("ignores a priceString from a different product id", async () => {
    const billing = createUnlockBilling({
      client: fakeClient({
        getProduct: async () => ({
          product: { identifier: "some_other_sku", priceString: "€4.49" },
        }),
      }),
      platform: { isNative: true, isDev: false, name: "ios" },
      storage: memoryStorage(),
    });
    expect(await billing.getPriceLabel()).toBe("A$9.99");
    expect(
      formatStorePriceLabel({ identifier: UNLOCK_PRODUCT_ID, priceString: "€4.49" }),
    ).toBe("€4.49");
  });
});

describe("paywall price copy", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

  it("does not hardcode $5.99 on unlock surfaces", () => {
    const files = [
      "src/pages/HomePage.tsx",
      "src/pages/AboutPage.tsx",
      "src/pages/StairsPage.tsx",
      "src/pages/ConcretePage.tsx",
      "src/components/unlock-gate.tsx",
      "src/components/unlock-provider.tsx",
      "src/components/tools/stairs-tool.tsx",
      "src/components/tools/concrete-tool.tsx",
      "src/lib/unlock.ts",
      "public/privacy.html",
      "docs/privacy.html",
      "ios/App/App/Info.plist",
      "ios/App/App/DistributionPlugin.swift",
      "ios/TradiesToolbox.storekit",
    ];
    for (const rel of files) {
      const source = readFileSync(path.join(root, rel), "utf8");
      expect(source, rel).not.toMatch(/5\.99/);
      expect(source, rel).not.toContain("$9.99 AUD");
    }
    const provider = readFileSync(path.join(root, "src/components/unlock-provider.tsx"), "utf8");
    expect(provider).toContain("useState(UNLOCK_PRICE_LABEL)");
    expect(provider).toContain("sanitizeUnlockPriceLabel(nextPrice)");
    expect(readFileSync(path.join(root, "src/pages/HomePage.tsx"), "utf8")).toContain(
      "priceLabel",
    );
    expect(readFileSync(path.join(root, "src/pages/AboutPage.tsx"), "utf8")).toContain(
      "priceLabel",
    );
    expect(readFileSync(path.join(root, "src/components/unlock-gate.tsx"), "utf8")).toContain(
      "Unlock both",
    );
    const billingSource = readFileSync(path.join(root, "src/lib/billing.ts"), "utf8");
    expect(billingSource).toContain("labelHasStaleSetoutPrice");
    expect(billingSource).toContain("amountIsStaleSetoutPrice");
    expect(billingSource).not.toContain("$9.99 AUD");
  });
});
