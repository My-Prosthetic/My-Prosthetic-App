# My-Prosthetic-App

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
npm ci
npm run lint
npm run format:check
npm run build
```

If `npm run format:check` reports formatting issues, run:

```bash
npm run format
```

Then run `npm run format:check` again to verify that all files are correctly formatted.

### CI

Frontend CI runs automatically for Pull Requests and pushes affecting the `frontend/` directory.

The pipeline checks:

* Formatting
* ESLint
* Application build