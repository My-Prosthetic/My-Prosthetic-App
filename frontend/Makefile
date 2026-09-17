.PHONY: initial ci format

initial:
	npm ci

ci:
	npm ci
	npm run lint
	npm run format:check
	npm run build

format:
	npm run format