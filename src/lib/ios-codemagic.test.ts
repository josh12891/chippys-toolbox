import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { UNLOCK_PRODUCT_ID } from "./unlock.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("Codemagic iOS CI", () => {
  it("builds a signed App Store IPA on mac_mini_m2 from the Capacitor ios/ project", () => {
    const yaml = read("codemagic.yaml");
    expect(yaml).toContain("ios-app-store:");
    expect(yaml).toContain("instance_type: mac_mini_m2");
    expect(yaml).toMatch(/^    triggering:\n      events:\n        - push$/m);
    expect(yaml).toContain("pattern: main");
    expect(yaml).toContain("npm ci");
    expect(yaml).toContain("npm run build");
    expect(yaml).toContain("npx cap sync ios");
    expect(yaml).toContain("distribution_type: app_store");
    expect(yaml).toContain("bundle_identifier: com.josh12891.tradiestoolbox");
    expect(yaml).toContain("BUNDLE_ID: com.josh12891.tradiestoolbox");
    expect(yaml).toContain("xcode-project build-ipa");
    expect(yaml).toContain("XCODE_WORKSPACE: App.xcworkspace");
    expect(yaml).toContain("XCODE_SCHEME: App");
    expect(yaml).toContain("agvtool new-version -all");
    expect(yaml).toContain("get-latest-testflight-build-number");
    expect(yaml).toContain("xcode-project use-profiles");
    const pbx = read("ios/App/App.xcodeproj/project.pbxproj");
    expect(pbx).toContain("MARKETING_VERSION = 1.0.4;");
    expect(pbx).not.toMatch(/MARKETING_VERSION = 1\.0;/);
    expect(pbx).not.toMatch(/MARKETING_VERSION = 1\.0\.1;/);
    expect(pbx).not.toMatch(/MARKETING_VERSION = 1\.0\.2;/);
    expect(pbx).not.toMatch(/MARKETING_VERSION = 1\.0\.3;/);
    expect(yaml).toContain("app-store-connect fetch-signing-files");
    expect(yaml).toContain("app-store-connect publish");
  });

  it("guards TestFlight and does not commit Apple secrets", () => {
    const yaml = read("codemagic.yaml");
    const gitignore = read(".gitignore");
    expect(yaml).toMatch(/^    integrations:\n      app_store_connect: tradies-toolbox-asc$/m);
    expect(yaml).toContain('PUBLISH_TESTFLIGHT: "true"');
    expect(yaml).toContain('APP_STORE_APPLE_ID: "6814369706"');
    expect(yaml).toContain("No App Store Connect API key in this environment - skip TestFlight.");
    expect(yaml).toContain("app-store-connect publish --path");
    // Native publisher stays commented so the script path does not double-upload.
    expect(yaml).toMatch(/#\s*app_store_connect:\s*$/m);
    expect(yaml).toMatch(/#\s*auth: integration/);
    expect(yaml).not.toMatch(/-----BEGIN PRIVATE KEY-----/);
    expect(yaml).not.toMatch(/AUTHKEY_[A-Z0-9]{10}/i);
    expect(yaml).not.toMatch(/Issuer ID:\s*[0-9a-f-]{20,}/i);
    expect(gitignore).toContain("*.p8");
    expect(gitignore).toContain("*.p12");
    expect(gitignore).toContain("*.mobileprovision");
    expect(gitignore).toContain("AuthKey_*.p8");
  });

  it("documents Codemagic signup, signing, TestFlight, and cost for Josh", () => {
    const docs = read("docs/ios-codemagic.md");
    const readme = read("README.md");
    expect(docs).toContain("push to `main`");
    expect(docs).toContain("codemagic.io");
    expect(docs).toContain("josh12891/chippys-toolbox");
    expect(docs).toContain("com.josh12891.tradiestoolbox");
    expect(docs).toContain(UNLOCK_PRODUCT_ID);
    expect(docs).toContain("500");
    expect(docs).toContain("$0.095");
    expect(docs).toContain("App Store Connect API");
    expect(docs).toContain("tradies-toolbox-asc");
    expect(docs).toContain("integrations.app_store_connect: tradies-toolbox-asc");
    expect(docs).toContain("Application variable");
    expect(docs).toContain("6814369706");
    expect(docs).toContain("Code signing identities");
    expect(docs).toContain("TestFlight");
    expect(docs).toContain("Never commit");
    expect(docs).toContain("sandboxReceipt");
    expect(docs).toContain("App Store customers still pay");
    expect(readme).toContain("docs/ios-codemagic.md");
    expect(readme).toContain("ios-app-store");
    expect(readme).toContain("codemagic.yaml");
    expect(readme).toContain("tradies-toolbox-asc");
    expect(readme).toContain("6814369706");
  });
});
