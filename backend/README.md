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

## Wallet entries

Authenticated patients can synchronize funding entries through the mobile API:

| Endpoint | Method | Payload/result |
| --- | --- | --- |
| `/api/wallet-entries` | `GET` | Lists entries owned by the authenticated patient |
| `/api/wallet-entries` | `POST` | Creates an entry from required UUID `goal_id`, `source`, integer `amount`, ISO-8601 `date`, and optional `note` |

The `amount` is stored in the smallest currency unit used by the mobile app (for
example, PLN grosze: `125000` represents `1250.00 PLN`). Supported sources are
`family`, `fundraiser`, `grant`, `savings`, and `other`.

Run the focused authentication tests from this directory with:

```bash
php artisan test --filter=AuthenticationTest
```

## User identities

Users have UUID primary keys, and every reference to a user (`sessions`,
`personal_access_tokens`, `wallet_entries`, `prostheses`, `user_shares`) uses a
UUID column. Registration, login, and profile responses keep their field names,
but clients must treat `id` as an opaque string. New tables that reference users
must use `foreignUuid()` (or `uuidMorphs()` for polymorphic owners).

The schema used UUIDs before the first deployment, so no data conversion exists.
After pulling this change, rebuild your local database:

```bash
php artisan migrate:fresh --seed
```

## Sharing persistence

`UserShare` is the pivot between a patient and a prosthetist: one current
directional share per pair, identified by its own UUID, with a JSON `permissions`
column that describes exactly what the specialist was selected to see:

```json
{ "medical_history": true, "prostheses": ["<uuid>"], "incidents": ["<uuid>"] }
```

The column is cast to the `App\ValueObjects\SharePermissions` value object.
Missing keys default to an empty selection, IDs are normalized to unique
lowercase UUIDs, and unknown keys or malformed values are rejected before they
reach the database. `SharePermissions::none()` is a valid share that selects
nothing. Selections are independent: a prosthesis does not imply its incidents,
and a selection never grants access to records the patient does not own.

Relations on `User`:

| Relation | Returns |
|---|---|
| `sharedSpecialists()` | Specialists a patient shares data with (`belongsToMany`) |
| `sharedPatients()` | Patients sharing data with a specialist (`belongsToMany`) |
| `grantedShares()` / `receivedShares()` | The `UserShare` records themselves (`hasMany`) |

On the `belongsToMany` relations the share is available as `$user->share`, with
cast permissions. `UserShare` also exposes `patient` and `specialist`.

Create a share with `$patient->sharedSpecialists()->attach($specialist, ['permissions' => $permissions])`,
replace the selection with `updateExistingPivot()` or by updating `permissions`
on the share, and revoke it with `detach()` or by deleting the share. Only
`permissions` is mass assignable; participants are fixed when the share is created.

The database rejects missing participants or permissions and duplicate pairs,
and permanently deleting either participant cascades to their shares. A user
cannot share with themselves: the model rejects it on every driver, and
PostgreSQL also enforces it with the `user_shares_distinct_participants` CHECK
constraint.

The model itself does not check roles or record ownership; the sharing
endpoints below validate both. Component visibility and effective authorization
remain out of scope; a stored share never authorizes a request on its own.

Run the focused persistence checks from this directory:

```bash
php vendor/bin/phpunit tests/Feature/UserShareTest.php tests/Unit/SharePermissionsTest.php
```

## Sharing API

Authenticated patients find prosthetists and manage which information each one
may see through the mobile API. Every endpoint requires `auth:sanctum` and is
available to patients only; prosthetists and administrators receive `403`.

| Endpoint | Method | Payload/result |
| --- | --- | --- |
| `/api/specialists/search?q=…` | `GET` | Lists matching prosthetists as `{ id, name }` |
| `/api/shares` | `GET` | Lists the patient's current grants, ordered by specialist name |
| `/api/shares` | `POST` | Creates a grant from a prosthetist's UUID `specialist_id` and `permissions`; `201`, or `409` if one already exists |
| `/api/shares/{specialist}` | `PUT` | Replaces the `permissions` of the grant for that prosthetist; `404` if there is none |
| `/api/shares/{specialist}` | `DELETE` | Revokes (permanently deletes) the grant for that prosthetist; `204`, or `404` if there is none |

A grant is addressed by the prosthetist's user id; a patient has at most one
grant per prosthetist. Grants are responses like:

```json
{
	"specialist": { "id": "<uuid>", "name": "Jan Kowalski" },
	"permissions": { "medical_history": true, "prostheses": ["<uuid>"], "incidents": [] },
	"created_at": "<ISO-8601>",
	"updated_at": "<ISO-8601>"
}
```

`permissions` is required and is an object; missing keys mean "not selected",
so `{}` is a valid grant that shares nothing. `medical_history` is a boolean,
`prostheses` is a list of UUIDs of the patient's own, non-deleted prostheses,
and `incidents` must be absent or empty until incident sharing is supported.
Unknown keys or malformed values return `422`. `PUT` replaces the whole
selection; narrowing it to nothing keeps the grant, and only `DELETE` revokes it.
A stored grant does not yet authorize a prosthetist to read anything.

### Specialist search

`q` is required, 3 to 100 characters after trimming, with at most 5 words. A
prosthetist matches when every word appears in their name, in any order,
ignoring letter case and Polish diacritics (`pawelka`, `Pawełka` and `PAWEŁKA`
are equivalent). `%` and `_` are matched literally. The whole query also
matches a prosthetist's **Specialist Code** exactly, ignoring case, spaces,
hyphens, and `O`/`I`/`L` typed for `0`/`1`. Results never include patients,
emails or codes, are ordered by name, are capped at 20, and the endpoint allows
30 requests per minute per user.

Every prosthetist gets a unique 8-character Specialist Code (Crockford base32,
without `I`, `L`, `O` and `U`) when the account is created. It appears as
`specialist_code` in the prosthetist's own profile, login and registration
responses, and is `null` for other roles.

Run the focused sharing API tests from this directory:

```bash
php vendor/bin/phpunit tests/Feature/SpecialistSearchTest.php tests/Feature/SpecialistCodeTest.php tests/Feature/ShareApiTest.php tests/Unit/SpecialistCodeTest.php
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
