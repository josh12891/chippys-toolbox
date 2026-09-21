import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TESTFLIGHT_SCREENSHOT_NOTE,
  classifyDistribution,
  classifyIosDistribution,
  detectDistribution,
  effectiveUnlocked,
  grantsComplimentaryUnlock,
} from "./distribution.ts";
import { canUseTool } from "./unlock.ts";
import { shouldUseLocalUnlockStub } from "./billing.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("iOS distribution classification", () => {
  it("treats App Store-signed sandbox receipts as TestFlight", () => {
    expect(
      classifyIosDistribution({
        receiptLastPathComponent: "sandboxReceipt",
        hasEmbeddedMobileProvision: false,
      }),
    ).toBe("testflight");
  });

  it("does not treat Xcode / Ad Hoc sandbox receipts as TestFlight", () => {
    expect(
      classifyIosDistribution({
        receiptLastPathComponent: "sandboxReceipt",
        hasEmbeddedMobileProvision: true,
      }),
    ).toBe("ios-dev");
  });

  it("classifies production App Store receipts as app-store", () => {
    expect(
      classifyIosDistribution({
        receiptLastPathComponent: "receipt",
        hasEmbeddedMobileProvision: false,
      }),
    ).toBe("app-store");
  });

  it("does not guess when the receipt path is missing", () => {
    expect(classifyIosDistribution({ receiptLastPathComponent: "", hasEmbeddedMobileProvision: false })).toBe(
      "unknown",
    );
    expect(classifyIosDistribution({})).toBe("unknown");
  });

  it("never complimentary-unlocks Play, web, App Store, or Xcode builds", () => {
    expect(classifyDistribution("android", null)).toBe("play");
    expect(classifyDistribution("web", null)).toBe("web");
    expect(grantsComplimentaryUnlock("play")).toBe(false);
    expect(grantsComplimentaryUnlock("web")).toBe(false);
    expect(grantsComplimentaryUnlock("app-store")).toBe(false);
    expect(grantsComplimentaryUnlock("ios-dev")).toBe(false);
    expect(grantsComplimentaryUnlock("unknown")).toBe(false);
    expect(grantsComplimentaryUnlock("testflight")).toBe(true);
  });
});

describe("complimentary TestFlight unlock", () => {
  it("unlocks paid tools on TestFlight without a purchase flag", () => {
    const consumed = { stairs: 1, concrete: 1 };
    expect(effectiveUnlocked(false, "testflight")).toBe(true);
    expect(canUseTool("stairs", effectiveUnlocked(false, "testflight"), consumed)).toBe(true);
    expect(canUseTool("concrete", effectiveUnlocked(false, "testflight"), consumed)).toBe(true);
  });

  it("keeps App Store and Play freemium gated after the free calculation", () => {
    const consumed = { stairs: 1, concrete: 1 };
    expect(effectiveUnlocked(false, "app-store")).toBe(false);
    expect(effectiveUnlocked(false, "play")).toBe(false);
    expect(canUseTool("stairs", effectiveUnlocked(false, "app-store"), consumed)).toBe(false);
    expect(canUseTool("concrete", effectiveUnlocked(false, "play"), consumed)).toBe(false);
  });

  it("still honours a real IAP / restore on every channel", () => {
    expect(effectiveUnlocked(true, "app-store")).toBe(true);
    expect(effectiveUnlocked(true, "play")).toBe(true);
    expect(effectiveUnlocked(true, "testflight")).toBe(true);
  });

  it("does not switch TestFlight onto the web/debug billing stub", () => {
    expect(
      shouldUseLocalUnlockStub({ isNative: true, isDev: false, name: "ios" }, true),
    ).toBe(false);
  });

  it("detects TestFlight from a native inspect and ignores inspect failures", async () => {
    await expect(
      detectDistribution({
        platformName: "ios",
        inspect: async () => ({
          receiptLastPathComponent: "sandboxReceipt",
          hasEmbeddedMobileProvision: false,
        }),
      }),
    ).resolves.toEqual({ channel: "testflight" });

    await expect(
      detectDistribution({
        platformName: "ios",
        inspect: async () => ({
          receiptLastPathComponent: "receipt",
          hasEmbeddedMobileProvision: false,
        }),
      }),
    ).resolves.toEqual({ channel: "app-store" });

    await expect(
      detectDistribution({
        platformName: "ios",
        inspect: async () => {
          throw new Error("UNIMPLEMENTED");
        },
      }),
    ).resolves.toEqual({ channel: "unknown" });

    await expect(detectDistribution({ platformName: "android" })).resolves.toEqual({
      channel: "play",
    });
  });

  it("tells testers they do not need to buy, and keeps Restore available", () => {
    expect(TESTFLIGHT_SCREENSHOT_NOTE).toMatch(/TestFlight tester build/i);
    expect(TESTFLIGHT_SCREENSHOT_NOTE).toMatch(/do not need to buy/i);
    expect(TESTFLIGHT_SCREENSHOT_NOTE).toMatch(/Restore purchases still works/i);
    expect(TESTFLIGHT_SCREENSHOT_NOTE).toMatch(/\$9\.99 AUD/);
  });
});

describe("iOS TestFlight plugin wiring", () => {
  it("registers a local Distribution plugin that checks sandboxReceipt", () => {
    const plugin = read("ios/App/App/DistributionPlugin.swift");
    const bridge = read("ios/App/App/BridgeViewController.swift");
    const storyboard = read("ios/App/App/Base.lproj/Main.storyboard");
    const pbx = read("ios/App/App.xcodeproj/project.pbxproj");
    const js = read("src/lib/distribution.ts");

    expect(plugin).toContain('@objc(DistributionPlugin)');
    expect(plugin).toContain('public let jsName = "Distribution"');
    expect(plugin).toContain("sandboxReceipt");
    expect(plugin).toContain("appStoreReceiptURL");
    expect(plugin).toContain("embedded");
    expect(plugin).toContain("mobileprovision");
    expect(bridge).toContain("registerPluginInstance(DistributionPlugin())");
    expect(storyboard).toContain('customClass="BridgeViewController"');
    expect(storyboard).not.toContain('customClass="CAPBridgeViewController"');
    expect(pbx).toContain("DistributionPlugin.swift");
    expect(pbx).toContain("BridgeViewController.swift");
    expect(js).toContain('registerPlugin<DistributionPluginApi>("Distribution"');
    expect(read("src/pages/AboutPage.tsx")).toContain("complimentaryUnlock");
    expect(read("src/pages/AboutPage.tsx")).toContain("TESTFLIGHT_SCREENSHOT_NOTE");
    expect(read("src/pages/AboutPage.tsx")).toContain("restorePurchases");
    expect(read("src/components/unlock-provider.tsx")).toContain("purchased || complimentaryUnlock");
    expect(read("README.md")).toContain("TestFlight only");
    expect(read("README.md")).toContain("do **not** bake a Codemagic compile flag");
  });

  it("bumps the iOS marketing version so TestFlight can take a new binary", () => {
    const pbx = read("ios/App/App.xcodeproj/project.pbxproj");
    expect(pbx).toContain("MARKETING_VERSION = 1.0.2;");
    expect(pbx).not.toMatch(/MARKETING_VERSION = 1\.0;/);
    expect(pbx).not.toMatch(/MARKETING_VERSION = 1\.0\.1;/);
  });
});
