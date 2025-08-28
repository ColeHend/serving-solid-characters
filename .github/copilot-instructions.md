## AI Assistant Guide (serving-solid-characters)
Practical rules to be instantly productive in this ASP.NET 8 API + SolidJS/Vite PWA delivering D&D SRD JSON with optional SQL Server persistence.

### 1. Architecture Snapshot
- Controllers in `Controllers/` map to `/api/*`; SRD versioned roots: `/api/2014/*`, `/api/2024/*` (see `DnD2024SrdController.cs`). Route segment after version MUST be Capitalized plural ("Spells", "Classes").
- Data sources:
	1. Legacy: `DndInfoRepository` (old JSON under `data/srd/old/*`).
	2. Current versioned: `SrdInfoRepository` (Transient) reading `data/srd/{2014|2024}/<lowercaseplural>.json` via `DbJsonService`.
- `DbJsonService` (Singleton) resolves base path (env `DB_JSON_ROOT` override) and deserializes raw JSON (`helpers/tools/DbJsonTool.cs`). Missing file -> throws (no silent swallow) so ensure correct filename & pluralization.
- EF Core context: `SharpAngleContext` (SQL Server) chosen by connection string name env `DB_CONNECTION_NAME` (defaults to `localDefault`). In container only HTTP (port 8080) with TLS terminated upstream.
- Frontend: `client/` SolidJS + Vite. Dev proxy (optional) rewrites `/api` -> backend. Production serves prebuilt `client/dist` (never move this path; hardcoded in `Program.cs`).
- PWA: service worker fixed filename `claims-sw.js` (cache headers tweaked in `Program.cs`).

### 2. Service Lifetimes & Patterns
- Singleton: `DbJsonService`, `DndInfoRepository` (avoid per-request IO scanning).
- Transient: `SrdInfoRepository`, mappers, token/user repos.
- Repositories return `List<T>` (no pagination/filtering server‑side). Clients handle all filtering.
- Version enforcement: every `SrdInfoRepository` method parses `version` string; only 2014 or 2024 else throws `ArgumentException` early.
- DTO mapping: `helpers/extensions/classMappers.cs` serializes polymorphic Feature.Value via `JsonConvert.SerializeObject` to `string` for transport (keep this when adding new feature shapes).

### 3. Adding / Extending SRD Entities
1. Add JSON file: `data/srd/<year>/<lowercaseplural>.json` (array root). Match other filenames (e.g. `spells.json`).
2. Ensure corresponding DTO class exists under `models/DTO/Updated/` (mirror naming of existing types).
3. Add method to `ISrdInfoRepository` + implement in `SrdInfoRepository` with version guard and `Array.Empty<T>()` fallback when null.
4. Expose endpoint in the correct version controller (`DnD2014SrdController` or `DnD2024SrdController`) using capitalized route segment. Wrap in try/catch -> log + `StatusCode(500)` on error.
5. Frontend: fetch via relative URL `/api/<year>/<CapitalizedPlural>` to leverage dev proxy / production static hosting.

### 4. Local Dev Workflow
1. (Optional HTTPS) `bash scripts/gen-dev-cert.sh` -> generates `ssl/dev-cert.pfx` (auto picked up by Kestrel; HTTPS :5000). Without it server falls back to HTTP :5000 (warn logged).
2. Run API: `dotnet run` (env: `DB_CONNECTION_NAME`, `DB_JSON_ROOT`, `USE_VITE_PROXY`, `PORT`).
3. Run client: `cd client && npm install && npm run dev` (Vite :3000 HTTPS if cert present). Keep all requests relative.
4. To use live Vite instead of built assets: set `USE_VITE_PROXY=true` before starting API.

### 5. Production / Docker
- Inside container: only HTTP on `:8080` (see Kestrel config); don't force HTTPS redirects there.
- Build & run: `docker compose up --build` (multi-stage: builds client then serves static + API). External reverse proxy should handle TLS + compression (gzip also enabled server-side for JSON).

### 6. PWA & Caching Nuances
- `claims-sw.js` served from `client/public` with `Cache-Control: no-store` in dev for immediate updates; built `dist` assets get 7d cache. Keep SW name constant unless you update header logic.
- When changing domains / certs: clear PWA + unregister SW if updates appear stuck.

### 7. Auth Status
- JWT bearer auth code is commented out in `Program.cs`. Avoid adding `[Authorize]` until re-enabled and `Jwt:*` settings provided. Password hashing uses HMACSHA512 (`UserRepository`).

### 8. Common Pitfalls (and fixes)
- 404 on SRD endpoint: verify capitalized route segment ("Spells" not `spells`).
- Empty list response: likely misnamed JSON file (plural or case) -> `GetJson<T>` attempted wrong path.
- Mixed content / cert errors: regenerate dev cert or keep all frontend fetches relative.
- Forgetting to update interface when adding repository method -> build error in controllers.
- Changing `client/dist` location breaks SPA hosting middleware chain.

### 9. Quick Command Reference
- API dev: `dotnet run`
- Client dev: `npm run dev` (inside `client/`)
- Build client: `npm run build`
- Local Docker: `docker compose up --build`

### 10. When Unsure
Search for an existing pattern (e.g. add new entity like `Feats`) and mirror repository method + controller action style; keep version validation + try/catch structure.

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
