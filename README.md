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

No login. About ships in-app. The store-facing privacy policy is `public/privacy.html` (copied to `docs/privacy.html` for GitHub Pages).

## Pricing

Freemium, **no ads**, offline, metric.

| | |
| --- | --- |
| Free | Triangle calculator, running measurements |
| Paid unlock | Stair set-out, concrete volume, and set-out (same one-time purchase) |
| Price | **$9.99 AUD** one-time |
| Product id | `tradies_toolbox_setout_unlock` (non-consumable / managed product) |

Native Android and iOS builds use **[@capgo/native-purchases](https://github.com/Cap-go/capacitor-native-purchases)** — Play Billing on Android and StoreKit 2 on iOS — for product id `tradies_toolbox_setout_unlock`. A successful purchase (or restore) caches an on-device flag (`localStorage` key `tradies-toolbox.unlock.v1`) so stairs and concrete stay available **offline**. **Restore purchases** queries the store account (required by Apple).

Web and debug builds keep the **local unlock stub** (same flag, not billed) so the paid UI can be reviewed without Play Console or App Store Connect. Production native builds do not use that stub when billing is available.

Paid routes: `/#/stairs`, `/#/concrete`.

## Privacy policy URL (GitHub Pages)

Public store URL (paste this into App Store Connect and Google Play):

**https://josh12891.github.io/chippys-toolbox/privacy.html**

`public/privacy.html` is the policy for **Tradies Toolbox** (`com.chippystoolbox.app`), published by **Joshua Pearson** (Apple Individual): no accounts, offline-first, no ads, optional $9.99 AUD IAP handled by Apple/Google. Vite copies it to `dist/privacy.html` for the Capacitor app (Home → Privacy, About, and `/#/privacy`). `npm run build` / `npm test` also copy it to `docs/privacy.html` for Pages.

### Enable GitHub Pages (once, after this is on `main`)

1. Open the repo on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Branch: **`main`**. Folder: **`/docs`**.
4. Save. Wait a minute for the first deploy.
5. Confirm: [https://josh12891.github.io/chippys-toolbox/privacy.html](https://josh12891.github.io/chippys-toolbox/privacy.html)

Do not use GitHub Actions for this URL unless you later change the Pages source. The `/docs` folder on `main` is enough.

Support / store contact: **josh@pearsonindustries.com.au**.

## Requirements

- Node.js 20+
- Android Studio (Ladybug or newer) for Play builds (minSdk 24)
- Xcode 16+ on macOS for App Store builds (iOS 15+)

## Scripts

```bash
npm install
npm run dev          # Vite SPA at http://localhost:5173
npm test             # math + billing + privacy-docs tests
npm run build        # sync docs/privacy.html, typecheck, production dist/
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

iOS project files can be generated on Linux; **signing, Simulator and App Store upload require a Mac**. This repo does not run Xcode or `pod install` in CI. StoreKit 2 (via `@capgo/native-purchases`) needs **iOS 15+**; the Xcode project and Podfile are set to that deployment target.

## Google Play — in-app product + license testers

Product: **`tradies_toolbox_setout_unlock`** · one-time (managed / non-consumable) · **$9.99 AUD**.

1. Play Console → the **Tradies Toolbox** app (`com.chippystoolbox.app`) → **Monetize** → **In-app products** → **Create product**.
2. Product ID must be exactly `tradies_toolbox_setout_unlock` (it cannot be changed later).
3. Type: **One-time product** (not a subscription). Status: **Active**.
4. Name / description: “Set-out unlock” — stair set-out + concrete volume, no ads, offline.
5. Default price: **AUD 9.99**. Save and activate.
6. **License testing:** Play Console → **Settings** → **License testing**. Add Gmail accounts that should get test purchases (no charge). Testers must use that Google account on the device.
7. Upload a signed AAB to an **internal testing** track (Play Billing will not work from a sideloaded debug APK that was never installed via Play). Testers opt in to the internal track link, install, then tap **Unlock**.
8. On device: open stairs or concrete → **Unlock** (Play purchase sheet) or **Restore purchases** (replays the Play account entitlement).
9. Emulators without Play Store / an unpaid license tester will fail billing; use a real device and the internal track.

The Android manifest includes `com.android.vending.BILLING`. `@capgo/native-purchases` talks to Play Billing directly (no RevenueCat account).

## App Store Connect — StoreKit IAP (no Mac required for this setup)

Same product id: **`tradies_toolbox_setout_unlock`** · Non-Consumable · **$9.99 AUD**.

1. In [App Store Connect](https://appstoreconnect.apple.com) accept the **Paid Applications Agreement** (Business → Agreements) so IAPs can be created.
2. Open the **Tradies Toolbox** app record (`com.chippystoolbox.app`) → **Monetization** → **In-App Purchases** → **Create**.
3. Type: **Non-Consumable**. Product ID: `tradies_toolbox_setout_unlock`.
4. Reference name: Set-out unlock. Localization (English AU): display name + description matching the Play listing.
5. Price Schedule: Australia **$9.99 AUD** (or the tier that maps to 9.99 AUD). Availability: all countries you ship.
6. Review screenshot / notes when you submit the binary. IAP must be submitted with an app version.
7. Create **Sandbox** Apple IDs (Users and Access → Sandbox) for device testing. Sign in with the sandbox account in Settings → App Store (not in iCloud) on a device.
8. Optional local Xcode testing (Mac): add `ios/TradiesToolbox.storekit` as a StoreKit Configuration file to the App scheme (*Product → Scheme → Edit Scheme → Run → Options → StoreKit Configuration*). Product id inside that file is `tradies_toolbox_setout_unlock`.

The same Capacitor plugin (`@capgo/native-purchases`) calls StoreKit 2 on iOS. Restore purchases is on the unlock screen (App Review requires it). You still need a Mac later to archive and upload; this tree is enough to wire the product id.

## Store checklist

- [ ] App icons and splash generated (`npm run assets`, then `npx cap sync`)
- [ ] Display name **Tradies Toolbox** on both stores
- [ ] Seller / publisher **Joshua Pearson** (Apple Individual)
- [ ] GitHub Pages enabled from `main` `/docs` so privacy is at **https://josh12891.github.io/chippys-toolbox/privacy.html**; support email **josh@pearsonindustries.com.au**
- [ ] Screenshots: home, concrete, stairs, running, triangle
- [ ] Age rating: tools/reference, no user-generated content
- [ ] Permissions: none required beyond Play Billing; speech uses OS TTS only
- [ ] Offline: airplane-mode smoke test of all four tools (after an unlock or restore)
- [ ] Stair disclaimer visible (NCC 2022 Housing Provisions 11.2 and AS 1657:2018 — soft hints, not a certificate)
- [ ] Play Console product `tradies_toolbox_setout_unlock` at $9.99 AUD one-time, **Active**, tested with **license testers** on an internal track
- [ ] App Store Connect non-consumable `tradies_toolbox_setout_unlock` at $9.99 AUD; sandbox restore
- [ ] Restore purchases uses store receipts (Play Billing / StoreKit), not only the local flag
- [ ] Signed Play AAB + App Store archive from the same `npm run build` commit

## Project layout

```
src/lib          concrete, stairs, running, triangle math + unlock/billing
src/components   tool UIs, diagrams, unlock gate
src/pages        home, About (Privacy opens public/privacy.html)
docs/            GitHub Pages (privacy.html + index)
public/privacy.html  source privacy policy (copied to dist/ and docs/)
ios/TradiesToolbox.storekit  optional StoreKit config for Xcode
prototype/       exact Grok calculator source used as the port origin
android/         Capacitor 7 Android project
ios/             Capacitor 7 iOS project
resources/       source icon + splash
```

Calculators are client-only. If a web prototype is dropped into this repo later, port it into `src/` and strip any auth, server or PGlite pieces.

## Licence

Private application source. Stair figures are a field aid — confirm with the certifier on the job.
