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
 
| Profile       | Output | Purpose                                              |
|---------------|--------|-------------------------------------------------------|
| `development` | `.apk` | Dev-client build for local development (hot reload, debugging) |
| `preview`     | `.apk` | Team/QA testing build                                  |
 
To trigger a build, from the `mobile` directory:
 
```bash
eas build --platform android --profile preview       # test build for QA
eas build --platform android --profile development   # dev-client build
```
 
After a `development` build is installed once on a device, run `npx expo start --dev-client` to connect to it.
 
Once the build finishes (a few minutes), a download link/QR code appears in the terminal and on the project's **Builds** page on [expo.dev](https://expo.dev). Install the `.apk` on an Android device (allow "install from unknown sources" if prompted).
 
**Notes:** the first build may prompt to generate an Android signing keystore — let EAS manage it automatically. Free-tier accounts have a monthly build limit.
 