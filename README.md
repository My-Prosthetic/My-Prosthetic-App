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
If formatting issues are found, run:
 
```bash
make format
```
 
Then run `make ci` again to verify that all checks pass.
 
### Available commands
 
| Command        | Description                                                    |
|-----------------|------------------------------------------------------------------|
| `make initial`  | Installs dependencies (`npm ci`)                                 |
| `make ci`       | Installs dependencies, then runs lint, format check and build (same as CI) |
| `make format`   | Formats code with Prettier (overwrites files)                    |
 
### CI
 
Frontend CI runs automatically for Pull Requests and pushes affecting the `frontend/` directory.
 
The pipeline runs the same checks as `make ci`:
 
* Formatting
* ESLint
* Application build
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
 
This runs, in order:
 
* ESLint (`make lint`)
* Prettier format check (`make format-check`)
* TypeScript check (`make typecheck`)
If `make format-check` reports formatting issues, run:
 
```bash
make format
```
 
Then run `make format-check` again to verify that all files are correctly formatted.
 
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
 
Mobile CI runs automatically for Pull Requests and pushes affecting the `mobile/` directory.
 
The pipeline uses the same `Makefile` targets as local development:
 
* Lint (`make lint`)
* Format check (`make format-check`)
* TypeScript check (`make typecheck`)
 
