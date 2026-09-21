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
  it("keeps applicationId com.josh12891.tradiestoolbox", () => {
    const gradle = read("android/app/build.gradle");
    const cap = JSON.parse(read("capacitor.config.json")) as { appId: string };
    const strings = read("android/app/src/main/res/values/strings.xml");
    expect(cap.appId).toBe("com.josh12891.tradiestoolbox");
    expect(gradle).toContain('applicationId "com.josh12891.tradiestoolbox"');
    expect(gradle).toContain('namespace "com.josh12891.tradiestoolbox"');
    expect(gradle).not.toContain('applicationId "com.chippystoolbox.app"');
    expect(strings).toContain("com.josh12891.tradiestoolbox");
    expect(read("android/app/src/main/java/com/josh12891/tradiestoolbox/MainActivity.java")).toContain(
      "package com.josh12891.tradiestoolbox;",
    );
  });

  it("targets API 36 and bumps versionCode past the previous internal AAB", () => {
    const variables = read("android/variables.gradle");
    const gradle = read("android/app/build.gradle");
    expect(variables).toMatch(/compileSdkVersion\s*=\s*36/);
    expect(variables).toMatch(/targetSdkVersion\s*=\s*36/);
    expect(gradle).toContain("versionCode 3");
    expect(gradle).toContain('versionName "1.0.2"');
  });

  it("declares Play Billing in the app manifest", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml");
    expect(manifest).toContain('android:name="com.android.vending.BILLING"');
  });

  it("declares TTS engine visibility so Play marks can speak on Android 11+", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml");
    const activity = read(
      "android/app/src/main/java/com/josh12891/tradiestoolbox/MainActivity.java",
    );
    const plugin = read(
      "android/app/src/main/java/com/josh12891/tradiestoolbox/SiteTtsPlugin.java",
    );
    expect(manifest).toContain("android.intent.action.TTS_SERVICE");
    expect(activity).toContain("registerPlugin(SiteTtsPlugin.class)");
    expect(plugin).toContain('name = "SiteTts"');
    expect(plugin).toContain("USAGE_MEDIA");
    expect(plugin).toContain("STREAM_MUSIC");
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
    expect(UNLOCK_PRODUCT_ID).toBe("tradies_toolbox_setout_unlock");
    expect(readme).toContain("com.josh12891.tradiestoolbox");
    expect(readme).not.toMatch(/applicationId "com\.chippystoolbox\.app"/);
    expect(readme).toContain("com.android.vending.BILLING");
    expect(readme).toContain("bundleRelease");
    expect(readme).toContain(UNLOCK_PRODUCT_ID);
    expect(readme).toContain("tradies_toolbox_setout_unlock");
    expect(readme).not.toMatch(/tradies[-]toolbox[-]setout[-]unlock/);
    expect(readme).toContain(UNLOCK_PRICE_LABEL);
    expect(readme).toContain("targetSdk **36**");
    expect(readme).toContain("keystore.properties");
    expect(readme).toContain(
      "https://github.com/josh12891/chippys-toolbox/releases/download/v1.0.2-internal-play/tradies-toolbox-1.0.2.aab",
    );
  });
});
