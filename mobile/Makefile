.PHONY: initial start ci lint format format-check typecheck help
 
# Manual
help:
	@echo "Dostępne komendy:"
	@echo "	make initial       - instaluje zależności (npm install)"
	@echo "	make start         - uruchamia Expo z czyszczeniem cache"
	@echo "	make ci            - uruchamia lint, format-check i typecheck (jak w pipeline CI)"
	@echo "	make lint          - uruchamia ESLint (npm run lint)"
	@echo "	make format        - formatuje kod Prettierem, nadpisuje pliki (npm run format)"
	@echo "	make format-check  - sprawdza formatowanie bez nadpisywania (npm run format:check)"
	@echo "	make typecheck     - sprawdza typy TypeScript (npx tsc --noEmit)"
 
# Instalacja zależności projektu — do użytku lokalnego/deweloperskiego.
initial:
	npm install --legacy-peer-deps
 
# Uruchomienie Expo z wyczyszczonym cache
start:
	npx expo start --clear
 
# Reszta analogicznie 
lint:
	npm run lint
 
format:
	npm run format
 
format-check:
	npm run format:check
 
typecheck:
	npx tsc --noEmit
 
# Pełna weryfikacja, w tej samej kolejności co kroki w mobile-ci.yml
ci: lint format-check typecheck
	@echo "✅ CI checks passed"