<p align="center">
  <a href="" rel="noopener">
 <img width=200px height=200px src="https://i.imgur.com/6wj0hh6.jpg" alt="Project logo"></a>
</p>

<h3 align="center">Project Title</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/kylelobo/The-Documentation-Compendium.svg)](https://github.com/colehend/The-Documentation-Compendium/issues)
<!-- [![GitHub Pull Requests](https://img.shields.io/github/issues-pr/kylelobo/The-Documentation-Compendium.svg)](https://github.com/colehend/The-Documentation-Compendium/pulls) -->
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center"> Few lines describing your project.
    <br> 
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Deployment](#deployment)
- [Usage](#usage)
- [Built Using](#built_using)
- [TODO](../TODO.md)
- [Contributing](../CONTRIBUTING.md)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🧐 About <a name = "about"></a>

Write about 1-2 paragraphs describing the purpose of your project.

## Coding Rules<a name = "coding"></a>

1. Things should ideally always work offline without internet.
2. Try and use coles-solid-library for components and formgroups.
3. Try and keep components small and readable.
4. Try and write unit tests for implemented stuff.

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install.

- .net SDK & Runtime installed
- a SQL Server connection string that works
 - Node.js (LTS) & npm
 - mkcert (for local HTTPS across API + Vite dev server)

### Installing

A step by step series of examples that tell you how to get a development env running.


make sure you have a active sqlDB running. and the connection string is correct.
```
"localDefault":"YourConnectionString"
```

### Unified Local HTTPS (.NET API + Vite + PWA)

1. Install mkcert (see project repo instructions) and trust the local CA.
2. Generate certificates (one time or when domains change):
  ```bash
  bash scripts/gen-dev-cert.sh
  ```
  This creates `ssl/dev-cert.pem|dev-key.pem|dev-cert.pfx` at the repository root (gitignored).
3. Start the backend API (Kestrel will use the PFX automatically if present):
  ```bash
  dotnet run
  ```
  Backend listens on https://localhost:5000 (or HTTP fallback if cert missing).
4. In another terminal start the client dev server (auto-detects HTTPS certs and proxies /api):
  ```bash
  cd client
  npm install
  npm run dev
  ```
5. Open https://localhost:3000 (PWA secure origin). All `/api/*` calls are proxied to the .NET backend with the self‑signed certificate accepted (secure: false in Vite proxy).

If you need a friendly domain add to `/etc/hosts`:
```
127.0.0.1 ssc.local
```
Re-run the cert script (adds ssc.local into SAN) and access via https://ssc.local:3000.

#### Mobile / LAN Testing
Run dev server with `--host` (already default). Add your machine IP to the cert by regenerating with that IP or hostname:
```
DOMAINS="localhost 127.0.0.1 ::1 ssc.local 192.168.1.42"
```
Clear old PWA install if you change scheme/host to avoid service worker scope issues.

#### Troubleshooting
| Issue | Fix |
|-------|-----|
| Browser "Not Secure" | Remove old certs, re-run script, restart browser |
| Mixed content errors | Ensure all API URLs are relative `/api/...` not absolute http:// links |
| SW not updating | DevTools > Application > Unregister, Clear site data, hard reload |
| Proxy not hitting backend | Confirm backend running on 5000, check console log `[vite] proxy /api -> ...` |

#### Production Contrast
Docker / container image only exposes HTTP :8080. Terminate TLS at reverse proxy (nginx, Caddy, Cloudflare). The self-signed certs here are strictly for local dev.

## 🔧 Running the tests <a name = "tests"></a>


### And coding style tests

To run the tests I haven't written.

```
dotnet test
```

## 🚀 Deployment <a name = "deployment"></a>

Add additional notes about how to deploy this on a live system.

For Development run the following command
```
dotnet run
```

### Docker
 
Build and run the container (multi-stage: builds SolidJS client + .NET API):

```
docker build -t serving-solid-characters .
docker run -p 8080:8080 serving-solid-characters
```

Then browse: http://localhost:8080

Using docker compose:

```
docker compose up --build
```

If you want a SQL Server container as well, uncomment the `sqlserver` service and related volume inside `docker-compose.yml`, then set an environment variable (or compose override) for the connection string, e.g.:

```
ConnectionStrings__work=Server=sqlserver,1433;Database=TestDb;User=sa;Password=Passw0rd!;TrustServerCertificate=True;Encrypt=False
```

Inside containers we serve plain HTTP on port 8080; terminate TLS at your ingress / reverse proxy. Local dev outside Docker still uses HTTPS with your `nethost.pfx`.

### CI/CD Deployment (GitHub Actions -> Linode)

Workflow builds and pushes an image to GHCR on pushes to `main`, then deploys to your Linode via SSH.

Required GitHub secrets:
| Secret | Description |
|--------|-------------|
| LINODE_SSH_KEY | Private key with access to target server |
| LINODE_HOST | Public IP / hostname of server |
| LINODE_USER | SSH user (must have docker perms) |
| (optional) GHCR_TOKEN | If server needs explicit login (usually not needed; PAT with read:packages) |

Server one-time prep (run manually on Linode):
```
sudo mkdir -p /opt/serving-solid-characters
sudo usermod -aG docker $USER # re-login
```

Deployment script path on server: `/opt/serving-solid-characters/deploy.sh`

To manually redeploy with a specific image tag:
```
ssh $LINODE_USER@$LINODE_HOST 'IMAGE_TAG=<sha> /opt/serving-solid-characters/deploy.sh'
```
## ⛏️ Built Using <a name = "built_using"></a>

- [SQL, Dexie]() - Database
- [Entity Framework]() - Server Framework
- [SolidJS]() - Web Framework
- [Asp.net 6]() - Server Environment

## ✍️ Authors <a name = "authors"></a>

- [@colehend](https://github.com/colehend) - Idea & Initial work
- [@SladeAnderson](https://github.com/SladeAnderson) - Ideas & Addtional work

See also the list of [contributors]() who participated in this project.

## 🛠 TODO
- Character viewing and creating
- Character PDF Generation and Viewing
- Import / Export Hombrew and characters

