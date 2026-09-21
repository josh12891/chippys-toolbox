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
    expect(appCopy).toContain("Australian Dynamics");
    expect(appCopy).toContain("australiancomsnetwork@gmail.com");
    expect(appCopy).toContain("com.josh12891.tradiestoolbox");
    expect(appCopy).not.toMatch(/Joshua Pearson|josh@pearsonindustries\.com\.au|Apple Individual/);
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

  it("uses Australian Dynamics contact on About, docs landing, and README", () => {
    const about = read("src/pages/AboutPage.tsx");
    const index = read("docs/index.html");
    const readme = read("README.md");
    const personal = /Joshua Pearson|josh@pearsonindustries\.com\.au|Apple Individual/;

    for (const copy of [about, index, readme]) {
      expect(copy).toContain("Australian Dynamics");
      expect(copy).toContain("australiancomsnetwork@gmail.com");
      expect(copy).not.toMatch(personal);
    }
  });
});
