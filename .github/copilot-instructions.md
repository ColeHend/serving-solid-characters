## AI Assistant Guide (serving-solid-characters)
Concise rules to be productive in this ASP.NET 8 + SolidJS/Vite + PWA project serving D&D SRD JSON (optional SQL Server persistence).

### Core Architecture
- API root: controllers in `Controllers/` => `/api/*`; versioned SRD under `/api/2014/*` & `/api/2024/*`.
- Data sources: (1) Legacy `DndInfoRepository` reading `data/srd/old/*`; (2) Versioned `SrdInfoRepository` (transient) reading `data/srd/{2014|2024}/<entity>.json` via `DbJsonService` (`helpers/tools/DbJsonTool.cs`).
- EF Core: `SharpAngleContext` (notably `DbSet<SpellEntity> Pokemon` misnamed). Connection chosen by env `DB_CONNECTION_NAME` (default key in `appsettings*.json`).
- SPA: `client/` SolidJS + Vite; dev proxy rewrites `/api` to backend; production serves prebuilt `client/dist` via static + SPA fallback in `Program.cs` (order matters—keep fallback last).

### Local Dev Workflow
1. (Optional) `bash scripts/gen-dev-cert.sh` to create `ssl/dev-cert.pfx`.
2. `dotnet run` (HTTPS :5000 if cert present, else HTTP). 
3. `cd client && npm install && npm run dev` (HTTPS :3000). 
4. Keep all frontend fetch URLs relative (`/api/...`).
Key env vars: `DB_JSON_ROOT` (override auto root), `USE_VITE_PROXY=true` (force live API), `BACKEND_URL` (proxy target), `PORT` (container override).

### Patterns & Conventions
- Repository methods return plain `List<T>`; no server pagination/filtering.
- SRD version guard: only 2014 / 2024; validate early (see `SrdInfoRepository`).
- DTO mapping lives in `helpers/extensions/classMappers.cs`—serialize nested generic feature values with `JsonConvert.SerializeObject` defensively.
- Service lifetimes: `DbJsonService` & `DndInfoRepository` = Singleton; `SrdInfoRepository` = Transient; use `Scoped` only for request state.
- Routes: Attribute names capitalized resource (`[HttpGet("Spells")]`)—UI depends on casing.
- Never relocate `client/dist`; referenced explicitly in `Program.cs`.

### Adding a New SRD Entity (canonical flow)
1. Add JSON: `data/srd/<year>/<lowercaseplural>.json` (array).
2. Ensure model exists under `models/DTO/Updated/`.
3. Add method to `ISrdInfoRepository` + implement in `SrdInfoRepository` (validate version, return `Array.Empty<T>()` if null).
4. Expose controller action in correct version controller mirroring e.g. `DnD2024SrdController` patterns (try/catch -> 500 on exception).

### Auth / Users
- JWT wiring currently commented out in `Program.cs`; avoid `[Authorize]` unless you re‑enable + add `Jwt` settings. Password hashing: HMACSHA512 in `UserRepository`.

### PWA / Frontend Nuances
- SW file fixed name `claims-sw.js`; adjust Workbox config in `vite.config.ts` when adding routes.
- ESLint build blocker: run `npm run build` before commits to catch failures.

### Docker / CI
- Image serves HTTP on :8080 (ASPNETCORE_URLS); do not assume :5000 in prod code.
- Node only present in build stage—keep JS deps inside `client/`.

### Common Pitfalls
- Missing cert -> mixed HTTPS assumptions; either regenerate or set `BACKEND_URL`.
- Forgetting capitalized route segment causes client 404.
- Misnaming JSON file (case/plural) leads to empty lists (due to `GetJson<T>` returning empty array on null).

### Quick Commands (reference)
- Dev API: `dotnet run`
- Dev client: `npm run dev` (in `client/`)
- Build SPA: `npm run build` (in `client/`)
- Docker (local): `docker compose up --build`

When unsure: search for an existing entity (e.g. "Feats") and mirror repository + controller pattern rather than bypassing layers.

Feedback: Highlight unclear areas (e.g. desire for caching layer, auth re‑enable plan) so this guide can iterate.

### 11. `coles-solid-library` Reference
A lightweight internal SolidJS utility/component library (`coles-solid-library`) is installed via `node_modules`. It ships with an in-repo usage document at:

`node_modules/coles-solid-library/USAGE.html`

Before creating new shared frontend helpers or components, open that HTML file (can be viewed directly in VS Code or a browser) to:
1. Review existing primitives (hooks, stores, UI atoms) and avoid duplicating logic.
2. Follow documented patterns (naming, signal vs store choices, error handling conventions).
3. Copy only the public usage patterns—do NOT inline or fork internal implementation unless absolutely required.

If you extend the library (e.g. by updating the package version or adding new exported APIs):
- Update `USAGE.html` within the library package (or contribute upstream if it is a separately published package).
- Note any new initialization requirements here if they affect app bootstrap.

When unsure whether to add a helper locally vs. to the library:
- Add to the library if it is generic across feature areas and has no backend coupling.
- Keep local if it is highly feature/domain specific to this app.

Reminder for future automation: Code generation or refactors that touch shared UI logic should first scan `coles-solid-library` exports to reuse rather than recreate.
