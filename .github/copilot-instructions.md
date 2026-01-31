## AI Assistant Guide (serving-solid-characters)
Practical rules to be instantly productive in this ASP.NET 8 API + SolidJS/Vite PWA delivering D&D SRD JSON with optional SQL Server persistence.

### 1. Architecture Snapshot
- **Solution structure**: 3-project layout at repo root:
  - `SolidCharacters` (web host): Controllers, Migrations, Helpers, Program.cs, appsettings
  - `SolidCharacters.Domain` (class library): Models, DTOs, Entities, Core types
  - `SolidCharacters.Repository` (class library): Repositories, DbContext, Services (DbJsonService)
- Controllers in `SolidCharacters/Controllers/` map to `/api/*`; SRD versioned roots: `/api/2014/*`, `/api/2024/*` (see `DnD2024SrdController.cs`). Route segment after version MUST be Capitalized plural ("Spells", "Classes").
- Data sources:
	1. Legacy: `DndInfoRepository` (old JSON under `data/srd/old/*`).
	2. Current versioned: `SrdInfoRepository` (Transient) reading `data/srd/{2014|2024}/<lowercaseplural>.json` via `DbJsonService`.
- `DbJsonService` (Singleton) resolves base path (env `DB_JSON_ROOT` override) and deserializes raw JSON (`SolidCharacters.Repository/Services/DbJsonTool.cs`). Missing file -> throws (no silent swallow) so ensure correct filename & pluralization.
- EF Core context: `SolidCharactersContext` (SQL Server) in `SolidCharacters.Repository/Data/`, chosen by connection string name env `DB_CONNECTION_NAME` (defaults to `localDefault`). In container only HTTP (port 8080) with TLS terminated upstream.
- Frontend: `SolidCharacters/client/` SolidJS + Vite inside web project (not at repo root). Dev proxy (optional) rewrites `/api` -> backend. Production serves prebuilt `client/dist` (paths computed from repoRoot in Program.cs).
- PWA: service worker fixed filename `claims-sw.js` (cache headers tweaked in `Program.cs`).

### 2. Service Lifetimes & Patterns
- Singleton: `DbJsonService`, `DndInfoRepository` (avoid per-request IO scanning).
- Transient: `SrdInfoRepository`, mappers, token/user repos.
- Repositories return `List<T>` (no pagination/filtering server‑side). Clients handle all filtering.
- Version enforcement: every `SrdInfoRepository` method parses `version` string; only 2014 or 2024 else throws `ArgumentException` early.
- DTO mapping: `SolidCharacters.Repository/Extensions/classMappers.cs` serializes polymorphic Feature.Value via `JsonConvert.SerializeObject` to `string` for transport (keep this when adding new feature shapes).

### 3. Adding / Extending SRD Entities
1. Add JSON file: `data/srd/<year>/<lowercaseplural>.json` (array root). Match other filenames (e.g. `spells.json`). Note: `data/` is at repo root.
2. Ensure corresponding DTO class exists under `SolidCharacters.Domain/Models/DTO/Updated/` (mirror naming of existing types).
3. Add method to `ISrdInfoRepository` + implement in `SrdInfoRepository` (both in `SolidCharacters.Repository/`) with version guard and `Array.Empty<T>()` fallback when null.
4. Expose endpoint in the correct version controller (`DnD2014SrdController` or `DnD2024SrdController` in `SolidCharacters/Controllers/`) using capitalized route segment. Wrap in try/catch -> log + `StatusCode(500)` on error.
5. Frontend: fetch via relative URL `/api/<year>/<CapitalizedPlural>` to leverage dev proxy / production static hosting.

### 4. Local Dev Workflow
1. (Optional HTTPS) `bash scripts/gen-dev-cert.sh` -> generates `ssl/dev-cert.pfx` (auto picked up by Kestrel; HTTPS :5000). Without it server falls back to HTTP :5000 (warn logged).
2. Run API: `cd SolidCharacters && dotnet run` (env: `DB_CONNECTION_NAME`, `DB_JSON_ROOT`, `USE_VITE_PROXY`, `PORT`). Or from repo root: `dotnet run --project SolidCharacters`.
3. Run client: `cd SolidCharacters/client && npm install && npm run dev` (Vite :3000 HTTPS if cert present). Keep all requests relative.
4. To use live Vite instead of built assets: set `USE_VITE_PROXY=true` before starting API.
5. Build solution: `dotnet build SolidCharacters.sln` from repo root.

### 5. Production / Docker
- Inside container: only HTTP on `:8080` (see Kestrel config); don't force HTTPS redirects there.
- Build & run: `docker compose up --build` (multi-stage: builds client then serves static + API). External reverse proxy should handle TLS + compression (gzip also enabled server-side for JSON).

### 6. PWA & Caching Nuances
- `claims-sw.js` served from `client/public` with `Cache-Control: no-store` in dev for immediate updates; built `dist` assets get 7d cache. Keep SW name constant unless you update header logic.
- When changing domains / certs: clear PWA + unregister SW if updates appear stuck.

### 7. Auth Status
- JWT bearer auth code is commented out in `SolidCharacters/Program.cs`. Avoid adding `[Authorize]` until re-enabled and `Jwt:*` settings provided. Password hashing uses HMACSHA512 (`UserRepository` in Repository project).

### 8. Common Pitfalls (and fixes)
- 404 on SRD endpoint: verify capitalized route segment ("Spells" not `spells`).
- Empty list response: likely misnamed JSON file (plural or case) -> `GetJson<T>` attempted wrong path.
- Mixed content / cert errors: regenerate dev cert or keep all frontend fetches relative.
- Forgetting to update interface when adding repository method -> build error in controllers.
- Path issues: `client/dist` and `data/` are at repo root; Program.cs computes `repoRoot` as 2 levels up from web project.
- Cross-project type references: Domain types in `SolidCharacters.Domain.*` namespaces, Repository services in `SolidCharacters.Repository.*`.

### 9. Quick Command Reference
- Build solution: `dotnet build SolidCharacters.sln`
- API dev: `dotnet run --project SolidCharacters`
- Client dev: `npm run dev` (inside `SolidCharacters/client/`)
- Build client: `npm run build`
- Local Docker: `docker compose up --build`

### 10. Project Dependencies
```
SolidCharacters (Web) 
├── SolidCharacters.Repository
│   └── SolidCharacters.Domain
└── SolidCharacters.Domain
```
- Domain has no project dependencies (pure models/DTOs)
- Repository depends on Domain (for entities/DTOs)
- Web depends on both (controllers use repos + DTOs)

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
