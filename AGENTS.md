# Repository Guidelines

All repository guidelines and instructions have been consolidated into [CLAUDE.md](./CLAUDE.md). Please read that file for project structure, build commands, coding style, and testing guidelines.

## Cursor Cloud specific instructions

### Overview
New Expensify is a React Native app (web/iOS/Android). In the cloud VM, only the **web** platform is relevant. The app is a pure frontend client — API calls proxy to the remote Expensify backend; there are no local backend services.

### Prerequisites (already configured in the VM snapshot)
- **Node.js 20.20.0** (per `.nvmrc`). Use `source /home/ubuntu/.nvm/nvm.sh && nvm use 20.20.0` if the shell doesn't pick it up automatically.
- `/etc/hosts` must contain `127.0.0.1 dev.new.expensify.com`.
- HTTPS certs at `config/webpack/certificate.pem` and `config/webpack/key.pem` (generated via `mkcert`).
- `.env` file copied from `.env.example`.

### Running the web dev server
```bash
npm run web
```
This starts two concurrent processes: a local API proxy (port 9000) and webpack-dev-server (HTTPS on port 8082 at `https://dev.new.expensify.com:8082/`). Initial compilation takes ~3 minutes. The proxy is skipped when `USE_WEB_PROXY=false` in `.env` (the default for contributors); API calls then go directly to `www.expensify.com`.

### Key commands (see `CLAUDE.md` for full list)
| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Typecheck (fast) | `npm run typecheck-tsgo` |
| Typecheck (CI gate) | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| Format | `npm run prettier` |
| Web dev server | `npm run web` |

### Gotchas
- The dev server requires HTTPS via self-signed certs. Chrome will show a security warning; bypass with "thisisunsafe" typed on the warning page.
- `npm run web` uses `concurrently` to run the proxy and webpack-dev-server. If only one exits (e.g., proxy skipped), the other keeps running — this is expected.
- The webpack build is large (~80 MB bundle). First compilation is slow; HMR subsequent reloads are fast.
- Login requires a valid Expensify account — "Couldn't retrieve account details" is expected for nonexistent emails. To test authenticated flows, provide real test credentials.
- `npm run test` runs all Jest tests. For a quicker subset, use `npx jest <path>` with `TZ=utc NODE_OPTIONS="--experimental-vm-modules --max_old_space_size=8192"`.
- `npm run lint` has `--max-warnings=314` — this is the current accepted threshold.
