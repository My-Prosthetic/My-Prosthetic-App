<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Authentication

The backend uses Laravel Sanctum for two explicit authentication flows:

| Endpoint | Client | Authentication result |
| --- | --- | --- |
| `POST /api/register` | Mobile application | Creates a `patient` account and returns a long-lived Bearer token |
| `POST /api/login` | Mobile application | Verifies a `patient` account and returns a long-lived Bearer token |
| `POST /api/web/login` | Specialist SPA | Creates a cookie-based session for a `prosthetist`; no token is returned |
| `GET /api/profile` | Mobile or SPA | Requires `auth:sanctum` and returns the authenticated user |
| `POST /api/logout` | Mobile application | Revokes only the current Personal Access Token |
| `POST /api/web/logout` | Specialist SPA | Invalidates the current session and rotates its CSRF token |

Public registration always creates a `patient`. The `role` field is rejected in the
request and cannot be used to create a specialist or administrator account.

### Mobile client

Registration and login accept `name`, `email`, `password`, and an optional
`device_name`. Registration also requires `password_confirmation`.

Send the returned token with every protected request:

```http
Authorization: Bearer <personal-access-token>
Accept: application/json
```

The token is returned only by a successful registration or mobile login. A mobile
logout revokes the token used for that request.

### Specialist SPA

The browser must use the API origin `http://localhost:8080` and the frontend origin
`http://localhost:5173` in the local Docker setup. The SPA flow is:

1. Request `GET /sanctum/csrf-cookie` with credentials enabled.
2. Submit `POST /api/web/login` with the session cookies and the decoded `X-XSRF-TOKEN`
	header.
3. Send the session cookie and `credentials: 'include'` with `GET /api/profile` and other
	stateful requests.
4. Submit `POST /api/web/logout` with the session cookies and CSRF header when the
	 specialist signs out.

For example, a browser client using `fetch` must enable credentials on each request:

```js
await fetch('http://localhost:8080/sanctum/csrf-cookie', {
	credentials: 'include',
});

await fetch('http://localhost:8080/api/web/login', {
	method: 'POST',
	credentials: 'include',
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-XSRF-TOKEN': decodedXsrfCookieValue,
	},
	body: JSON.stringify({
		email: 'prosthetist@example.com',
		password: 'password',
	}),
});
```

### Environment

Set these values in the backend environment and replace the local origins in
production with the exact HTTPS origins used by the deployed SPA:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SANCTUM_EXPIRATION=null
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SESSION_HTTP_ONLY=true
AUTH_LOGIN_RATE_LIMIT=5
```

`SANCTUM_STATEFUL_DOMAINS` contains hosts with optional ports and never includes a
scheme. `SESSION_DOMAIN` must not contain a port. Do not configure a wildcard CORS
origin while `supports_credentials` is enabled. Production must use HTTPS and
`SESSION_SECURE_COOKIE=true`.

Authentication failures use this JSON shape and return HTTP `401`:

```json
{
	"message": "The provided credentials are invalid.",
	"errors": {
		"email": ["The provided credentials are invalid."]
	}
}
```

The specialist session flow currently establishes the Sanctum session foundation.
TOTP/2FA is intentionally a separate ticket, but it is required before the
specialist panel can be exposed in production under NFR-02.01 and FR-01.14.

Run the focused authentication tests from this directory with:

```bash
php artisan test --filter=AuthenticationTest
```

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
