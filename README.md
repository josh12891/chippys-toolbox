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
| Privacy policy (paste into Play + App Store Connect) | **https://josh12891.github.io/chippys-toolbox/privacy.html** |
| IAP product id | `tradies_toolbox_setout_unlock` |
| IAP price | **$9.99 AUD** one-time (not a subscription) |

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

Paste this exact URL into **Google Play Console** (App content → Privacy policy) and **App Store Connect** (App Privacy / privacy policy URL):

```
https://josh12891.github.io/chippys-toolbox/privacy.html
```

That file is `docs/privacy.html` in this repo (synced from `public/privacy.html` on `npm test` / `npm run build`). Seller **Joshua Pearson**; support **josh@pearsonindustries.com.au**. The Capacitor app also ships `dist/privacy.html` for offline use (Home → Privacy, About, `/#/privacy`).

### Enable GitHub Pages (once — do this before filling Play / App Store forms)

1. GitHub repo **josh12891/chippys-toolbox** → **Settings** → **Pages**.
2. **Build and deployment** → **Source:** Deploy from a branch.
3. **Branch:** `main` · **Folder:** `/docs` · **Save**.
4. Wait 1–2 minutes, then open [https://josh12891.github.io/chippys-toolbox/privacy.html](https://josh12891.github.io/chippys-toolbox/privacy.html) — it must load (not 404) before you paste it into the stores.
5. After this PR merges, keep Pages on **`main` / `/docs`**. To preview the URL *before* merge, you can temporarily point Pages at this PR branch (`cursor/store-path-iap-7a2f`) and `/docs`; switch back to `main` after merge. The public URL does not change.

Do not switch Pages to GitHub Actions unless you intend to change that URL. Support: **josh@pearsonindustries.com.au**.

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

## Google Play — product + internal testing (do this now)

Play Console is live. Billing only works if **all four** of these are true: the one-time product exists and is **Active**, the tester Gmail is a **license tester**, the signed AAB is on the **internal testing** track, and the phone installed the app **from that Play opt-in link** (not a sideloaded debug APK).

Package: `com.chippystoolbox.app` · Product: **`tradies_toolbox_setout_unlock`** · **$9.99 AUD** one-time.

### 1. Create the one-time product

1. [Play Console](https://play.google.com/console) → app **Tradies Toolbox** (`com.chippystoolbox.app`).
2. If Play has not seen this package yet, upload a signed AAB first (Internal testing, below) — in-app products are often locked until the first artifact exists.
3. **Monetize with Play** → **Products** → **In-app products** → **Create product** (or **Monetize** → **In-app products**).
4. Product ID (cannot be changed later): `tradies_toolbox_setout_unlock`
5. Type: **One-time product** (managed / non-consumable). **Not** a subscription.
6. Name: Set-out unlock. Description: Stair set-out and concrete volume. One-time, no ads, works offline.
7. Default price: **AUD 9.99**. Activate / **Active**.
8. Paste the privacy URL from above into **App content** → **Privacy policy** if Play asks.

### 2. License testers (so Unlock is not a real charge)

Internal testers **are charged for IAP** unless they are also license testers. Your Play publisher account is already a license tester.

1. Play Console (account gear, not only the app) → **Settings** → **License testing** (sometimes **Setup** → **License testing**).
2. **Create list** (or pick an existing email list). Add every Gmail that will tap Unlock on a device, including Josh’s.
3. **Save changes**. Propagation can take up to a couple of hours.
4. On the test phone, Settings → Google / Play Store must be signed in as **that same Gmail**.

### 3. Internal testing track (how testers install)

Play Billing **will not** run on a USB-sideloaded debug APK. Testers must install from Play.

1. `npm run cap:sync` then open `android/` in Android Studio.
2. Create an upload keystore the first time (*Build → Generate Signed App Bundle*). Do **not** commit `.jks` / `.keystore`. Keep the passwords.
3. Bump `versionCode` / `versionName` in `android/app/build.gradle` when you ship a new AAB (`1` / `1.0` is fine for the first upload).
4. Play Console → **Test and release** → **Testing** → **Internal testing**.
5. **Testers** tab → **Create email list** → add the same Gmails (up to 100) → Save. Feedback email: **josh@pearsonindustries.com.au**.
6. Copy the **Join on the web** / opt-in link. Testers open it while signed into that Gmail, tap **Become a tester**, then install **Tradies Toolbox** from the Play Store listing that link opens.
7. **Releases** → **Create new release** → upload the signed **.aab** → Review → **Start rollout to Internal testing**. First-time upload is usually available within minutes; the opt-in link can take a few hours the first time.

### 4. On-device purchase test

1. Real device with Play Store (not a Play-less emulator). Uninstall any old sideloaded copy first.
2. Install from the internal-test opt-in link.
3. Open **Stair set-out** or **Concrete volume** → **Unlock** (`tradies_toolbox_setout_unlock`). You should see a Play sheet with a **test** card / “this is a test purchase” notice, not a live charge.
4. After purchase, stairs and concrete stay unlocked offline (on-device flag). **Restore purchases** re-reads the Play account if the app is reinstalled.
5. If the sheet says the item is unavailable: product not Active, AAB package id mismatch, or wait for the product to publish after the first artifact. If you are charged for real: that Gmail is missing from **License testing**.

`@capgo/native-purchases` uses Play Billing 8 directly (no RevenueCat). The manifest includes `com.android.vending.BILLING`.

## App Store Connect — StoreKit IAP (wired in this PR; archive still needs a Mac)

Same plugin and product id: **`tradies_toolbox_setout_unlock`** · Non-Consumable · **$9.99 AUD**. Apple Developer is live; you can create the IAP now. CI still does not run Xcode.

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
- [ ] GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `/docs`**. Confirm **https://josh12891.github.io/chippys-toolbox/privacy.html** loads; paste that URL into Play and App Store Connect; support **josh@pearsonindustries.com.au**
- [ ] Screenshots: home, concrete, stairs, running, triangle
- [ ] Age rating: tools/reference, no user-generated content
- [ ] Permissions: none required beyond Play Billing; speech uses OS TTS only
- [ ] Offline: airplane-mode smoke test of all four tools (after an unlock or restore)
- [ ] Stair disclaimer visible (NCC 2022 Housing Provisions 11.2 and AS 1657:2018 — soft hints, not a certificate)
- [ ] Play: product `tradies_toolbox_setout_unlock` Active at $9.99 AUD; license testers saved; signed AAB on **Internal testing**; testers installed from the opt-in link (not sideload)
- [ ] Play: on-device Unlock sheet is a **test** purchase; Restore purchases returns the entitlement after reinstall
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
