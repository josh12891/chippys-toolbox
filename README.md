# Tradies Toolbox

On-site set-out for Australian trades — **concrete, stairs, running measurements and a 90° triangle**, built for the tape, not the office.

This is a **Capacitor + Vite + React + TypeScript SPA**. All web assets are bundled into the native shells so the four tools work **offline**. It does **not** wrap `https://toolbox.grok.me`.

| | |
| --- | --- |
| Display name | Tradies Toolbox |
| Package / app ID | `com.chippystoolbox.app` |
| Seller / publisher | Joshua Pearson (Apple Individual) |
| Support email | josh@pearsonindustries.com.au |
| npm name | `chippys-toolbox` |
| Audience | Australian tradies on the job |

## Tools

The four tools sit equally on the home screen (no carpenter-only ranking):

1. **Concrete volume** — slabs (multi), strip footings and piers; mm or m; job total in m³; order quantity rounded up to 0.2 m³; diagrams.
2. **Stair set-out** — NCC Housing and AS 1657; auto / manual tread / overall run; rise, going, 2R+G, pitch, landings; max 18 risers per flight. NCC/AS figures are **soft on-site hints**, not a hard compliance stop; confirm with the certifier.
3. **Running measurements** — ends vs between; members / spaces / max gap; centres, gaps and marks; **Play / Stop** speech read-out (`en-AU`).
4. **Triangle calculator** — right angle from sides and/or angles; diagram; 3-4-5 (and 5-12-13) detect.

No login. About ships in-app. The store-facing privacy policy is `public/privacy.html`.

## Pricing (locked)

Freemium, **no ads**, offline, metric.

| | |
| --- | --- |
| Free | Triangle calculator, running measurements |
| Paid unlock | Stair set-out, concrete volume, and set-out (same one-time purchase) |
| Price | **$9.99 AUD** one-time |
| Product id (placeholder) | `tradies_toolbox_setout_unlock` |

This PR **does not** wire App Store / Play Billing. Paid routes (`/#/stairs`, `/#/concrete`) show a clean unlock screen. Tapping **Unlock · $9.99 AUD** sets a local flag (`localStorage` key `tradies-toolbox.unlock.v1`) so the full tool UI can still be reviewed. **Restore purchases** reads that same flag.

Follow-up: StoreKit 2 + Play Billing, restore receipts, and replace the local flag. Apple requires a Restore control; the button is already on the unlock screen.

## Privacy policy (store URL)

`public/privacy.html` is the public policy for **Tradies Toolbox** (`com.chippystoolbox.app`), published by **Joshua Pearson** (Apple Individual): no accounts, offline-first, no ads, optional $9.99 AUD IAP handled by Apple/Google. Vite copies it to `dist/privacy.html`, so the Capacitor app can open it offline (Home → Privacy, About, and `/#/privacy`).

App Store Connect and Google Play need a **public https URL**. Host that file on any static host. GitHub Pages example:

1. Copy `public/privacy.html` to the Pages root (or enable Pages from the `/docs` folder and put the file at `docs/privacy.html`).
2. Store privacy URL: `https://josh12891.github.io/chippys-toolbox/privacy.html`

Support / store contact: **josh@pearsonindustries.com.au**.

## Requirements

- Node.js 20+
- Android Studio (Ladybug or newer) for Play builds
- Xcode 16+ on macOS for App Store builds

## Scripts

```bash
npm install
npm run dev          # Vite SPA at http://localhost:5173
npm test             # math unit tests
npm run build        # typecheck + production dist/
npm run assets       # regenerate icon/splash PNGs from the brand mark
npm run cap:sync     # build web assets and copy into android/ + ios/
npm run cap:android  # sync then open Android Studio
npm run cap:ios      # sync then open Xcode (macOS)
```

## Capacitor workflow

```bash
npm install
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

- **appId:** `com.chippystoolbox.app` (kept; bundle-id rename later if needed)
- **appName:** `Tradies Toolbox`
- **webDir:** `dist` (see `capacitor.config.json`)
- Platforms live in `android/` and `ios/` and are committed so store builds are reproducible.

Live reload against a packager is optional and **not** used for store binaries. Production always loads the bundled `dist` copy.

## Android Studio

1. Install Android Studio with the Android SDK and a device/emulator.
2. `npm run cap:android` (or open `android/` in Android Studio).
3. Set a release keystore for Play (do not commit `.keystore` / `.jks` files).
4. Product flavour / version: bump `versionCode` / `versionName` in `android/app/build.gradle`.
5. Build a signed AAB: *Build → Generate Signed App Bundle*.

## Xcode

1. On macOS, `npm run cap:ios` (or open `ios/App/App.xcworkspace`).
2. Select the **App** target. Bundle ID must stay `com.chippystoolbox.app`.
3. Choose your development team under *Signing & Capabilities*.
4. Display name: **Tradies Toolbox**.
5. Archive and upload with Transporter / Organizer.

iOS project files can be generated on Linux; **signing, Simulator and App Store upload require a Mac**.

## Store checklist

- [ ] App icons and splash generated (`npm run assets`, then `npx cap sync`)
- [ ] Display name **Tradies Toolbox** on both stores
- [ ] Seller / publisher **Joshua Pearson** (Apple Individual)
- [ ] Privacy policy URL is the hosted `privacy.html` (e.g. `https://josh12891.github.io/chippys-toolbox/privacy.html`); support email **josh@pearsonindustries.com.au**
- [ ] Screenshots: home, concrete, stairs, running, triangle
- [ ] Age rating: tools/reference, no user-generated content
- [ ] Permissions: none required; speech uses OS TTS only
- [ ] Offline: airplane-mode smoke test of all four tools
- [ ] Stair disclaimer visible (NCC 2022 Housing Provisions 11.2 and AS 1657:2018 — soft hints, not a certificate)
- [ ] IAP product `tradies_toolbox_setout_unlock` at $9.99 AUD one-time (App Store Connect + Play Console)
- [ ] Restore purchases wired to store receipts (Apple requirement)
- [ ] Signed Play AAB + App Store archive from the same `npm run build` commit

## Project layout

```
src/lib          concrete, stairs, running, triangle math + unlock flag (ported from prototype/)
src/components   tool UIs and diagrams (ported from prototype/)
src/pages        home, About (Privacy opens public/privacy.html)
prototype/       exact Grok calculator source used as the port origin
android/         Capacitor 7 Android project
ios/             Capacitor 7 iOS project
resources/       source icon + splash
```

Calculators are client-only. If a web prototype is dropped into this repo later, port it into `src/` and strip any auth, server or PGlite pieces.

## Licence

Private application source. Stair figures are a field aid — confirm with the certifier on the job.
