## AI Assistant Project Instructions (serving-solid-characters)

Purpose: Help agents quickly make correct, idiomatic changes across this full‑stack app (ASP.NET 8 API + SolidJS/Vite PWA) that serves D&D SRD data from JSON files and optional SQL Server persistence.

### 1. Architecture / Data Flow
- Backend: ASP.NET Core 8 (`Program.cs`) exposes REST controllers under `/api/*` plus versioned SRD routes `/api/2014/*` and `/api/2024/*` (see `Controllers/`).
- Two SRD data layers:
  1. Legacy aggregated repo: `DndInfoRepository` (old JSON under `data/srd/old/*`) via `IDndInfoRepository` – used by `DnDInfoController`.
  2. Versioned SRD repo: `SrdInfoRepository` (`ISrdInfoRepository`) reading structured JSON at `data/srd/{2014|2024}/<entity>.json`.
- JSON access abstraction: `DbJsonService` (`helpers/tools/DbJsonTool.cs`) centralizes file root resolution + deserialization; most repositories rely on it.
- EF Core context: `SharpAngleContext` (currently only `Users` + a misnamed `Pokemon` set for spells). Connection string chosen via env var `DB_CONNECTION_NAME` (default `localDefault`).
- Frontend: `client/` SolidJS + Vite + PWA (`vite.config.ts`), proxies `/api` to backend (auto picks https://localhost:5000 when dev cert present). Built assets copied into container (`client/dist`).
- Deployment: Single container image (multi‑stage Dockerfile) serves API + static SPA over HTTP :8080 (TLS terminated upstream). GH Actions workflow builds, tests, pushes to GHCR, then remote deploys.

### 2. Environment & Running
- Local dev (preferred): run backend `dotnet run` (serves HTTPS :5000 if `ssl/dev-cert.pfx` exists), then `npm run dev` in `client/` (HTTPS :3000). Generate certs with `bash scripts/gen-dev-cert.sh`.
- Env vars of interest: `DB_CONNECTION_NAME`, `DB_JSON_ROOT`, `USE_VITE_PROXY=true` (forces live proxy instead of static build), `BACKEND_URL` (overrides Vite proxy target), `PORT` (container/platform override), `DOTNET_RUNNING_IN_CONTAINER` auto set in Dockerfile.
- JSON data root auto-detected; to override, set `DB_JSON_ROOT` to directory containing `data/`.

### 3. Key Conventions / Patterns
- Repositories return plain lists (no pagination / filtering server side). Maintain that simplicity unless explicitly extending.
- Validation for SRD version: `SrdInfoRepository` methods parse `version` to int and throw on unsupported value (only 2014, 2024). Preserve or extend with explicit guard.
- Mapping pattern: Heavy JSON -> lean DTO via extension / mapper (`helpers/extensions/classMappers.cs`), serializing complex Feature.Value objects to JSON strings. When adding new mappers, follow per‑property transformations and defensive `JsonConvert.SerializeObject` for nested generic feature values.
- Authorization policies named `GuestPolicy`, `UserPolicy`, `AdminPolicy` defined but JWT auth currently commented out; adding protected endpoints should either (a) re‑enable JWT block in `Program.cs` or (b) avoid `[Authorize]` until auth flows restored.
- Static + SPA middleware ordering in `Program.cs` is deliberate (compression -> forwarded headers -> static -> routing -> auth -> controllers -> SPA fallback). Keep fallback late to avoid hijacking API routes.
- Service registration: Backing repos use appropriate lifetimes: `DbJsonService` & `DndInfoRepository` as singletons (cache JSON on startup); versioned `SrdInfoRepository` is transient. If adding stateful per-request logic, prefer `Scoped`.
- Data files: Each logical entity file holds an array (e.g., `spells.json` -> `Spell[]`). Null results normalized to `Array.Empty<T>()`.

### 4. Adding / Updating SRD Data
- Place new versioned JSON at `data/srd/<year>/<entity>.json` (lowercase plural). Ensure deserialization type exists in `models/DTO/Updated/` (e.g., `Spell`, `Feat`).
- Extend `ISrdInfoRepository` + implementation if introducing a new entity set (guard version, return empty list on null).
- Add controller action under appropriate version controller (`DnD2014Controller` / `DnD2024Controller`) mirroring existing pattern: try/catch, log to console, return 500 on exception.

### 5. Working With Users / Auth
- `UserRepository` supplies role & identity helpers. Password hashing uses HMACSHA512 (salt = key). No token issuance currently (JWT code block commented). Before implementing login endpoints, re‑enable JWT bearer setup and ensure `Jwt` settings exist in `appsettings.json`.
- Entity naming issue: `SharpAngleContext` defines `DbSet<SpellEntity> Pokemon`; correct or add migration if you depend on relational persistence for spells.

### 6. Frontend Integration Notes
- All API calls should be relative `/api/...` so Vite proxy + service worker rewriting works across HTTPS/HTTP dev & prod.
- PWA service worker filename forced to `claims-sw.js`; when adding Workbox routes adjust `vite.config.ts` `VitePWA` config accordingly.
- Linting: Build fails on ESLint errors (failOnError=true for build plugin). Quick fix: run `npm run build` locally before committing to catch issues.

### 7. Docker / CI Nuances
- Dockerfile installs Node in build stage only; keep frontend deps in `client/`. Adding root-level Node deps requires updating Dockerfile steps pre publish.
- CI workflow builds test container but currently does not run HTTP smoke test (commented). If adding tests, implement minimal curl check or backend `dotnet test` additions.
- Port inside container is :8080 (ASPNETCORE_URLS). Do not hardcode :5000 assumptions in production code.

### 8. Performance / Safety Considerations
- `DbJsonService.GetJson<T>` reads file each call (no caching per file beyond initial aggregate lists in legacy repo). If you introduce high-frequency endpoints, consider in-memory caching layer but ensure hot‑reload dev simplicity is preserved.
- Large JSON arrays served whole; introduce pagination parameters only with coordinated frontend update.

### 9. Common Pitfalls / Gotchas
- Missing dev cert: backend logs warning and serves HTTP on :5000; Vite still tries HTTPS if certs present in client/ssl or root/ssl. Ensure both sides see same cert set or override `BACKEND_URL`.
- Adding new controller route requires attribute route starting with capitalized resource (`[HttpGet("Spells")]`) to stay consistent; clients rely on exact casing.
- Don't move `client/dist` path; `Program.cs` uses hardcoded `client/dist` for static file provider and SPA root.

### 10. Minimal Extension Example
Add new SRD entity "WeaponMasteries" (already implemented 2024):
1. JSON file: `data/srd/2024/weaponmasteries.json` (array of objects matching `WeaponMastery`).
2. Interface: already `GetWeaponMasteries()` in `ISrdInfoRepository`.
3. Implementation: method exists in `SrdInfoRepository` returning list.
4. Controller: `DnD2024Controller.Masteries()` exposes `/api/2024/Masteries`.
Replicate this pattern for any new entity.

### 11. When Unsure
- Search repository for existing pattern (e.g., `GetFeats`, `Backgrounds`) and mirror signature & error handling.
- Prefer extending repository + controller instead of reading files directly from controllers (maintain layering).

---
Feedback welcome: Identify unclear conventions or desired additions (tests, auth re‑enable, caching) so this doc can evolve based on real usage.
