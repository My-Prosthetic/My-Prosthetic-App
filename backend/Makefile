.PHONY: initial ci format test analyse lint

initial:
	composer install --no-interaction --prefer-dist
	@[ -f .env ] || cp .env.example .env
	php artisan key:generate --ansi

ci: test analyse lint

test:
	php artisan test

analyse:
	vendor/bin/phpstan analyse --memory-limit=1G

lint:
	vendor/bin/pint --test

format:
	vendor/bin/pint