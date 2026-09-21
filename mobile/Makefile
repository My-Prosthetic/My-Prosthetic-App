.PHONY: initial start ci lint format format-check typecheck help
 
# Manual
help:
	@echo "Available commands:"
	@echo "	make initial       - install dependencies (npm install)"
	@echo "	make start         - launches Expo with cache cleaning"
	@echo "	make ci            - launches linter, format-checks and type-checks (same as CI in pipeline)"
	@echo "	make lint          - launches ESLint (npm run lint)"
	@echo "	make format        - formats code with Prettier, overwrites files (npm run format)"
	@echo "	make format-check  - checks formatting without overwriting (npm run format:check)"
	@echo "	make typecheck     - TypeScript type-checking (npx tsc --noEmit)"
 
# Project's dependencies installation —  for local/developer usage.
initial:
	npm install --legacy-peer-deps
 
# Launches Expo with cache cleaning
start:
	npx expo start --clear

# Self-explanatory
lint:
	npm run lint
 
format:
	npm run format
 
format-check:
	npm run format:check
 
typecheck:
	npx tsc --noEmit
 
# Full verification, same order as in mobile pipeline (mobile-ci.yml).
ci: lint format-check typecheck
	@echo "✅ CI checks passed"