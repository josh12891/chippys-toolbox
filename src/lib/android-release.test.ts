import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { UNLOCK_PRICE_LABEL, UNLOCK_PRODUCT_ID } from "./unlock.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("Play release AAB wiring", () => {
  it("keeps applicationId com.chippystoolbox.app", () => {
    const gradle = read("android/app/build.gradle");
    const cap = JSON.parse(read("capacitor.config.json")) as { appId: string };
    const strings = read("android/app/src/main/res/values/strings.xml");
    expect(cap.appId).toBe("com.chippystoolbox.app");
    expect(gradle).toContain('applicationId "com.chippystoolbox.app"');
    expect(gradle).toContain('namespace "com.chippystoolbox.app"');
    expect(strings).toContain("com.chippystoolbox.app");
  });

  it("declares Play Billing in the app manifest", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml");
    expect(manifest).toContain('android:name="com.android.vending.BILLING"');
  });

  it("wires release signing from gitignored keystore.properties", () => {
    const gradle = read("android/app/build.gradle");
    const example = read("android/keystore.properties.example");
    const gitignore = read(".gitignore");
    expect(gradle).toContain("signingConfigs");
    expect(gradle).toContain("keystore.properties");
    expect(gradle).toContain("signingConfig signingConfigs.release");
    expect(example).toContain("storeFile=upload-keystore.jks");
    expect(example).toContain("keyAlias=upload");
    expect(gitignore).toContain("android/keystore.properties");
    expect(gitignore).toContain("*.jks");
    expect(gitignore).toContain("UPLOAD_KEYSTORE.md");
  });

  it("documents first-AAB upload then IAP create", () => {
    const readme = read("README.md");
    expect(readme).toContain("com.chippystoolbox.app");
    expect(readme).toContain("com.android.vending.BILLING");
    expect(readme).toContain("bundleRelease");
    expect(readme).toContain(UNLOCK_PRODUCT_ID);
    expect(readme).toContain(UNLOCK_PRICE_LABEL);
    expect(readme).toContain("Internal testing");
    expect(readme).toContain("keystore.properties");
  });
});
