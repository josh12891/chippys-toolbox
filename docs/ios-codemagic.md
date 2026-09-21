# iOS CI on Codemagic (no local Mac)

Build a **signed App Store IPA** for Tradies Toolbox on a cloud Mac, then optionally upload it to **TestFlight**. You do not need a Mac at home.

| | |
| --- | --- |
| Workflow | `ios-app-store` in [`codemagic.yaml`](../codemagic.yaml) |
| Machine | `mac_mini_m2` |
| Bundle id | `com.josh12891.tradiestoolbox` |
| IAP product | `tradies_toolbox_setout_unlock` (unchanged — StoreKit, not the CI file) |
| Secrets | Codemagic UI only. Never commit `.p8`, `.p12`, or passwords. |

## Cost

- **Free individual plan:** 500 Mac mini M2 minutes refilled every month.
- **After that:** about **$0.095 / minute** on M2 ([Codemagic pricing](https://codemagic.io/pricing)).
- A first Capacitor + Xcode archive is often **15–30 minutes**. Stay on the free bucket if you start builds **manually** (this workflow does not run on every git push).

## 1. Sign up and connect GitHub

1. Create a free account at [codemagic.io](https://codemagic.io) (GitHub login is fine).
2. **Add application** → connect **GitHub** → repo **`josh12891/chippys-toolbox`**.
3. Project type can be **Ionic Capacitor** or **iOS**.
4. Open the app → **codemagic.yaml** → scan **`main`** (or this PR branch) and confirm workflow **iOS App Store IPA** (`ios-app-store`) appears.

## 2. Create an App Store Connect API key

Needs an Apple Developer Program membership (already live for this app).

1. [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**.
2. **+** new key. Name: `Codemagic` (or similar). Access: **App Manager**.
3. **Generate**, then **Download API Key** (`.p8` — Apple shows it once). Save it in a password manager, not git.
4. Note **Issuer ID** (top of the keys table) and **Key ID**.

## 3. Add the key to Codemagic

**Team integrations (recommended):**

1. Codemagic → **Team settings** → **Team integrations** → **Developer Portal** → **Manage keys**.
2. **Add key**. Name it exactly **`tradies-toolbox-asc`** (this is the placeholder in `codemagic.yaml`).
3. Paste Issuer ID + Key ID. Upload the `.p8`.
4. Uncomment `integrations.app_store_connect: tradies-toolbox-asc` in `codemagic.yaml` when you want the native publisher later. The workflow already reads the same values if Codemagic injects `APP_STORE_CONNECT_*` into the environment.

**Or Application / Team variables** (group name `app_store_credentials` if you uncomment `environment.groups` in the yaml):

| Variable | Secret? | Value |
| --- | --- | --- |
| `APP_STORE_CONNECT_ISSUER_ID` | yes | Issuer ID |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | yes | Key ID |
| `APP_STORE_CONNECT_PRIVATE_KEY` | yes | Full `.p8` text |
| `APP_STORE_APPLE_ID` | no | Numeric Apple ID from the app record → **App Information** |
| `PUBLISH_TESTFLIGHT` | no | `true` (default in yaml) or `false` to skip upload |

## 4. Code signing (one of these)

App Store / TestFlight needs an **Apple Distribution** certificate and an **App Store** provisioning profile for `com.josh12891.tradiestoolbox`.

### A. Automatic via the ASC API (easiest)

1. Finish step 3 so Codemagic can talk to Apple.
2. **Team settings** → **codemagic.yaml settings** → **Code signing identities**.
3. **iOS certificates** → **Generate certificate** → type **Apple Distribution** → pick the ASC key → Create. Download the `.p12` + password into your password manager (shown once).
4. **iOS provisioning profiles** → **Fetch profiles** → pick the **App Store** profile for `com.josh12891.tradiestoolbox` (create that App ID / profile in the Apple Developer portal first if none exists).
5. `ios_signing` in the yaml fetches those files on each build (`distribution_type: app_store`).

If `APP_STORE_CONNECT_*` is present, the workflow also runs `app-store-connect fetch-signing-files --type IOS_APP_STORE --create` so Apple can create a matching profile when you allow that.

### B. Upload your own files

Same **Code signing identities** screens: upload a `.p12` distribution cert and a `.mobileprovision` App Store profile. `ios_signing` matches them by bundle id.

## 5. Run the workflow

1. Codemagic app page → **Start new build**.
2. Workflow **iOS App Store IPA**. Branch: `main` (or this PR).
3. Start. When it finishes, download **`App.ipa`** from artifacts.

The Xcode project is `ios/App/App.xcworkspace`, scheme **App**. Web build is `npm ci` → `npm run build` → `npx cap sync ios`.

## 6. TestFlight (guarded)

Publishing **does not fail the build** when Apple credentials are missing. The signed IPA stays a downloadable artifact.

Upload happens only when **all** of these are true:

- `PUBLISH_TESTFLIGHT` is `true` (yaml default)
- `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, and `APP_STORE_CONNECT_PRIVATE_KEY` are set in the build environment

Then `app-store-connect publish` uploads the IPA. It appears under TestFlight after Apple processing (often 5–15 minutes). Internal testers can install; turn on external groups in App Store Connect if you need them.

To skip upload: set `PUBLISH_TESTFLIGHT` to `false` in the Codemagic UI.

Optional later: uncomment `publishing.app_store_connect` (`auth: integration`, `submit_to_testflight: true`) if you prefer Codemagic’s native publisher and have `integrations.app_store_connect` enabled. Do not enable both at once or you may upload twice.

## 7. App Store Connect app record

Create **Tradies Toolbox** (`com.josh12891.tradiestoolbox`) in App Store Connect before the first upload. Privacy URL: `https://josh12891.github.io/chippys-toolbox/privacy.html`. IAP `tradies_toolbox_setout_unlock` is created in the app record (see README); CI does not create the product.

## Checklist

- [ ] Codemagic free account, GitHub repo connected, yaml scanned
- [ ] ASC API key downloaded once; stored in Codemagic + password manager
- [ ] Distribution cert + App Store profile in Code signing identities
- [ ] Manual **ios-app-store** build produces `App.ipa`
- [ ] With ASC env set, IPA shows in TestFlight
- [ ] Nothing secret committed (`.p8` / `.p12` / `.mobileprovision` stay gitignored)
