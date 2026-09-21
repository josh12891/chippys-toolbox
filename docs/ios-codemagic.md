# iOS CI on Codemagic (no local Mac)

Build a **signed App Store IPA** for Tradies Toolbox on a cloud Mac, then optionally upload it to **TestFlight**. You do not need a Mac at home.

| | |
| --- | --- |
| Workflow | `ios-app-store` in [`codemagic.yaml`](../codemagic.yaml) |
| Machine | `mac_mini_m2` |
| Bundle id | `com.josh12891.tradiestoolbox` |
| IAP product | `tradies_toolbox_setout_unlock` (unchanged — StoreKit, not the CI file) |
| App Store Apple ID | `6814369706` (Tradies Toolbox AU; set in yaml for Personal accounts) |
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
2. **Add key**. Name it exactly **`tradies-toolbox-asc`** (must match `integrations.app_store_connect` in `codemagic.yaml`).
3. Paste Issuer ID + Key ID. Upload the `.p8`.
4. `ios-app-store` already sets `integrations.app_store_connect: tradies-toolbox-asc`. That injects `APP_STORE_CONNECT_*` so signing and TestFlight publish run when the key exists. Do not put the `.p8` in git.

**Or Application / Team variables** (group name `app_store_credentials` if you uncomment `environment.groups` in the yaml):

| Variable | Secret? | Value |
| --- | --- | --- |
| `APP_STORE_CONNECT_ISSUER_ID` | yes | Issuer ID |
| `APP_STORE_CONNECT_KEY_IDENTIFIER` | yes | Key ID |
| `APP_STORE_CONNECT_PRIVATE_KEY` | yes | Full `.p8` text |
| `APP_STORE_APPLE_ID` | no | Numeric Apple ID from the app record → **App Information** (`6814369706` for Tradies Toolbox AU) |
| `PUBLISH_TESTFLIGHT` | no | Application variable (optional). Yaml default is `true`. Set `false` in the Codemagic UI to skip upload |

Personal Codemagic accounts may not have Application variable groups. In that case set `APP_STORE_APPLE_ID` in [`codemagic.yaml`](../codemagic.yaml) (already filled for Tradies Toolbox AU). Keep `.p8` / `.p12` / passwords in the Codemagic UI — never commit them.

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

- `PUBLISH_TESTFLIGHT` is `true` (yaml default; override with Application variable `PUBLISH_TESTFLIGHT` in the Codemagic UI)
- The Developer Portal integration **`tradies-toolbox-asc`** is present (or `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_IDENTIFIER`, and `APP_STORE_CONNECT_PRIVATE_KEY` are set as Application secrets)

Then `app-store-connect publish` uploads the IPA. It appears under TestFlight after Apple processing (often 5–15 minutes). Internal testers can install; turn on external groups in App Store Connect if you need them.

To skip upload: set Application variable `PUBLISH_TESTFLIGHT` to `false` in the Codemagic UI.

Keep `publishing.app_store_connect` commented. The script publisher already uploads when the integration is present. Enabling the native publisher as well would upload twice.

## 7. App Store Connect app record

Create **Tradies Toolbox** (`com.josh12891.tradiestoolbox`) in App Store Connect before the first upload. Apple ID **`6814369706`**. Privacy URL: `https://josh12891.github.io/chippys-toolbox/privacy.html`. IAP `tradies_toolbox_setout_unlock` is created in the app record (see README); CI does not create the product.

## Checklist

- [ ] Codemagic free account, GitHub repo connected, yaml scanned
- [ ] `APP_STORE_APPLE_ID` is `6814369706` in yaml (Personal accounts: set it there if Application variable groups aren’t available)
- [ ] Developer Portal key named exactly **`tradies-toolbox-asc`** (matches `integrations.app_store_connect`)
- [ ] ASC API key downloaded once; stored in Codemagic + password manager (never git)
- [ ] Distribution cert + App Store profile in Code signing identities
- [ ] Manual **ios-app-store** build produces `App.ipa`
- [ ] With the integration present and `PUBLISH_TESTFLIGHT=true`, IPA shows in TestFlight
- [ ] Nothing secret committed (`.p8` / `.p12` / `.mobileprovision` stay gitignored)
