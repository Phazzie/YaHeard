# Deployment Guide

This project is built with SvelteKit v2, Vite v5, and TypeScript. It targets DigitalOcean App Platform for production but runs well locally on Windows/macOS/Linux.

## Adapters and Windows caveat

The repo uses a conditional adapter strategy defined in `svelte.config.js`:
- On CI/DigitalOcean (when `CI` or `DO_APP_PLATFORM` is set) or non-Windows platforms, it uses the Node.js adapter for DigitalOcean App Platform deployment.
- On Windows local builds, it falls back to the auto adapter to avoid a symlink `EPERM` error some users encounter during the final adapter output step. This does not affect `npm run dev` or `npm run preview`.

You can force the Node.js adapter locally by setting `DO_APP_PLATFORM=1` in the environment, but you may hit the Windows symlink limitation.

## Node.js runtime

- Requires Node.js >= 20.0.0 (see `package.json` engines)
- Package manager: npm

## Environment variables

Copy `.env.example` to `.env` and set at least one API key:

```
OPENAI_API_KEY=
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
```

On DigitalOcean App Platform, define these in your app settings → Environment Variables.

## Security considerations

- CSRF: Implements a stateless double-submit cookie. Works on serverless—no shared state. Ensure HTTPS in production so the CSRF cookie is marked `secure`.
- Rate limiting: Current implementation uses an in-memory Map for development only. For production with multiple instances, replace with Redis or another distributed store and remove in-memory state.
- Headers: Consider adding Content Security Policy (CSP) and security headers via app platform settings.

## DigitalOcean App Platform configuration

The repo includes a `.do/app.yaml` file that defines the app configuration for DigitalOcean App Platform. You can deploy this app in two ways:

### Option 1: Using doctl CLI
```bash
doctl apps create --spec .do/app.yaml
```

### Option 2: Using DigitalOcean Control Panel
1. Go to the Apps section in your DigitalOcean Control Panel
2. Click "Create App"
3. Choose "Use App Spec" and upload the `.do/app.yaml` file

Build commands:

```bash
npm install
npm run build
```

Start command:
```bash
npm start
```

Preview locally:

```bash
npm run preview
```

## Troubleshooting

- Windows build fails with symlink EPERM: This is why auto adapter is used locally. Use WSL or build on CI/Linux/macOS if you need a local Node.js build.
- 500s due to missing API keys: Ensure at least one of the provider keys is set.
- CSRF errors: Reload the page to refresh the token; the app uses double-submit cookie validation on each request.

## Next steps

- Replace dev rate limiting with Redis for production.
- Add CSP and observability/structured logging.