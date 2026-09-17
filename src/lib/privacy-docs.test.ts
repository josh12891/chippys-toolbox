import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PUBLIC_PRIVACY_URL } from "./unlock.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("GitHub Pages privacy policy", () => {
  it("keeps docs/privacy.html identical to the in-app public copy", () => {
    const appCopy = read("public/privacy.html");
    const pagesCopy = read("docs/privacy.html");
    expect(pagesCopy).toBe(appCopy);
    expect(appCopy).not.toMatch(/className=/);
    expect(appCopy).toContain("Joshua Pearson");
    expect(appCopy).toContain("josh@pearsonindustries.com.au");
    expect(appCopy).toContain("com.josh12891.tradiestoolbox");
  });

  it("documents the public Pages URL on the docs landing page and in README", () => {
    const index = read("docs/index.html");
    const readme = read("README.md");
    expect(PUBLIC_PRIVACY_URL).toBe(
      "https://josh12891.github.io/chippys-toolbox/privacy.html",
    );
    expect(index).toContain(PUBLIC_PRIVACY_URL);
    expect(index).toContain("./privacy.html");
    expect(readme).toContain(PUBLIC_PRIVACY_URL);
    expect(readme).toContain("tradies_toolbox_setout_unlock");
    expect(readme).toContain("Test and release");
    expect(readme).toContain("License testing");
  });
});
