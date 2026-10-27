# My-Prosthetic-App
 
---
 
## Frontend Development
 
### Running with Docker
 
 
From the project root:
 
 
```bash
docker compose up --build
```
 
 
The application is available at:
 
 
```text
http://localhost:5173
```
 
 
To stop the development environment:
 
 
```bash
docker compose down
```
 
 
### Local Quality Checks
 
 
From the `frontend` directory:
 
 
```bash
make ci
```
 
This runs, in order:
 
* Install dependencies (`npm ci`)
* ESLint
* Prettier format check
* Application build
If formatting issues are found, run `make format`, then run `make ci` again to verify that all checks pass.
 
### Available commands
 
| Command        | Description                                                    |
|-----------------|------------------------------------------------------------------|
| `make initial`  | Installs dependencies (`npm ci`)                                 |
| `make ci`       | Installs dependencies, then runs lint, format check and build (same as CI) |
| `make format`   | Formats code with Prettier (overwrites files)                    |
 
### CI
 
Frontend CI runs automatically for Pull Requests and pushes affecting the `frontend/` directory, running the same checks as `make ci`.
 
---
 
## Mobile Development
 
### Running the app
 
From the `mobile` directory:
 
```bash
make initial
make start
```
 
`make start` runs Expo with a cleared cache (`npx expo start --clear`), which helps avoid stale bundler errors.
 
### Local Quality Checks
 
From the `mobile` directory:
 
```bash
make ci
```
 
This runs, in order: ESLint (`make lint`) → Prettier format check (`make format-check`) → TypeScript check (`make typecheck`).
 
If `make format-check` reports issues, run `make format`, then `make format-check` again to verify.
 
### Available commands
 
| Command             | Description                                              |
|----------------------|-----------------------------------------------------------|
| `make initial`       | Installs dependencies (`npm install --legacy-peer-deps`) |
| `make start`         | Starts Expo with a cleared cache                          |
| `make ci`            | Runs lint, format-check and typecheck (same as CI)        |
| `make lint`          | Runs ESLint                                                |
| `make format`        | Formats code with Prettier (overwrites files)              |
| `make format-check`  | Checks formatting without modifying files                  |
| `make typecheck`     | Runs TypeScript type checking                               |
| `make help`          | Lists available commands                                    |
 
### CI
 
Mobile CI runs automatically for Pull Requests and pushes affecting the `mobile/` directory, using the same `Makefile` targets as local development (`make lint`, `make format-check`, `make typecheck`).
 
### Building installable app files (EAS Build)

The project uses [EAS Build](https://docs.expo.dev/build/introduction/) to generate `.apk` files, so the team can test the app on a physical Android device without a full dev environment or Expo Go.

**One-time setup:**

```bash
npm install -g eas-cli
eas login
```

> `eas` not found after install? Use `npx eas-cli <command>` instead — no PATH fix needed.

Ask to be added to the `my-prosthethic-app` organization on [expo.dev](https://expo.dev) so builds are associated with the team, not a personal account.

**Build profiles** (defined in `mobile/eas.json`):

| Profile          | Output | Purpose                                                        |
|------------------|--------|----------------------------------------------------------------|
| `development`    | `.apk` | Dev-client build for local development (hot reload, debugging) |
| `preview`        | `.apk` | Team/QA testing build                                          |
| `production`     | `.aab` | Google Play bundle (not installable directly)                  |
| `production-apk` | `.apk` | Installable production build, used by the release pipeline     |

To trigger a build manually, from the `mobile` directory:

```bash
eas build --platform android --profile preview       # test build for QA
eas build --platform android --profile development   # dev-client build
```

After a `development` build is installed once on a device, run `npx expo start --dev-client` to connect to it.

Once the build finishes (a few minutes, longer when Expo's queue is busy), a download link/QR code appears in the terminal and on the project's **Builds** page on [expo.dev](https://expo.dev). Install the `.apk` on an Android device (allow "install from unknown sources" if prompted).

**Notes:** the first build may prompt to generate an Android signing keystore — let EAS manage it automatically. Free-tier accounts have a monthly build limit.

### Release pipeline (GitHub Actions)

The **Release Mobile** workflow (`.github/workflows/release-mobile.yml`) builds the app on EAS Cloud and publishes the APK as a GitHub Release, without anyone building locally.

**One-time setup (repo admin)** — Settings → Secrets and variables → Actions:

| Name                 | Type     | Value                                                                    |
|----------------------|----------|--------------------------------------------------------------------------|
| `EXPO_TOKEN`         | Secret   | Expo access token (expo.dev → Account settings → Access tokens)          |
| `API_URL_PREVIEW`    | Variable | Staging backend URL, e.g. `https://staging.example.com/api`              |
| `API_URL_PRODUCTION` | Variable | Production backend URL, e.g. `https://api.example.com/api`               |

The URLs are variables, not secrets, on purpose: `EXPO_PUBLIC_*` values are embedded in the app and readable by anyone with the APK. Include `/api` at the end, as in `.env.example`.

**Running a build:**

1. Open **Actions → Release Mobile → Run workflow**.
2. Choose the branch to build from.
3. Fill in the inputs:

| Input         | Meaning                                                                                                          |
|---------------|------------------------------------------------------------------------------------------------------------------|
| `version`     | SemVer without `v`, e.g. `1.0.0`. The run fails on any other format.                                             |
| `environment` | `preview` = staging backend + EAS profile `preview`. `production` = production backend + EAS profile `production-apk`. |

4. Wait for the run to finish. The EAS build can take 40+ minutes when Expo's queue is busy.

**What the pipeline does:**

1. Validates the version format.
2. Writes `EXPO_PUBLIC_API_URL` into `mobile/.env` and `mobile/.env.production` for the chosen environment (on the runner only, nothing is committed).
3. Sets `expo.version` in `app.json` to the entered version (runner only).
4. Runs `eas build` with the matching profile. EAS auto-increments the Android version code.
5. Downloads the APK and attaches it to a GitHub Release.

**Result:**

| Environment  | Release tag                   | Type        |
|--------------|-------------------------------|-------------|
| `production` | `v1.0.0`                      | Release     |
| `preview`    | `v1.0.0-preview.<run number>` | Pre-release |

Re-running `production` with the same version updates the existing release, so use a new version for every real release.

**Troubleshooting:**

- **"API URL variable ... is empty or missing":** the repository variable for that environment isn't set.
- **"Version must look like 1.0.0":** use `X.Y.Z` only.
- **Credentials error from EAS:** the Android keystore isn't set up on Expo. Run `eas build --platform android --profile preview` once locally.
- **Checking which backend URL a build contains:** unzip the APK and search `assets/index.android.bundle` for the URL.
- **Publishing to Google Play:** the release pipeline produces an installable `.apk`. A Play Store upload needs an `.aab`, which the `production` profile builds.