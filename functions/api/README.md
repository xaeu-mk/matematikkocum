# API structure

Cloudflare Pages Functions live in this directory.

- `/api/health` — deployment/API health check
- `/api/data/health` — reports whether D1 (`DB`) and R2 (`STORAGE`) bindings are available
- `/api/auth/session` — session status scaffold
- `/api/auth/login` — login endpoint scaffold; it intentionally does not authenticate until D1 credentials and production crypto are configured

## Planned production bindings

```toml
[[d1_databases]]
binding = "DB"
database_name = "matematikkocum"
database_id = "YOUR_D1_DATABASE_ID"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "matematikkocum"
```

Do not commit real secrets, database IDs that should remain private, or user credentials. Configure production secrets/bindings in Cloudflare.
