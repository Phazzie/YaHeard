# Deployment Guide

This project is built with SvelteKit v2, Vite v5, and TypeScript. It targets Vercel for production but runs well locally on Windows/macOS/Linux.

## Adapters and Windows caveat

The repo uses a conditional adapter strategy defined in `svelte.config.js`:
- On CI/Vercel (when `CI` or `VERCEL` is set) or non-Windows platforms, it uses the Vercel adapter with `maxDuration: 300`.
- On Windows local builds, it falls back to the auto adapter to avoid a symlink `EPERM` error some users encounter during the final adapter output step. This does not affect `npm run dev` or `npm run preview`.

You can force the Vercel adapter locally by setting `VERCEL=1` in the environment, but you may hit the Windows symlink limitation.

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

On Vercel, define these in Project Settings → Environment Variables.

## Security considerations

- CSRF: Implements a stateless double-submit cookie. Works on serverless—no shared state. Ensure HTTPS in production so the CSRF cookie is marked `secure`.
- Rate limiting: Current implementation uses an in-memory Map for development only. For serverless or multi-instance, replace with Redis or another distributed store and remove in-memory state.
- Headers: Consider adding Content Security Policy (CSP) and security headers via a middleware or platform settings.

## Vercel configuration

The repo includes a `vercel.json` primarily for local consistency. SvelteKit’s adapter handles routing automatically.

Build commands:

```bash
npm install
npm run build
```

Preview locally:

```bash
npm run preview
```

## Troubleshooting

- Windows build fails with symlink EPERM: This is why auto adapter is used locally. Use WSL or build on CI/Linux/macOS if you need a local Vercel build.
- 500s due to missing API keys: Ensure at least one of the provider keys is set.
- CSRF errors: Reload the page to refresh the token; the app uses double-submit cookie validation on each request.

## Next steps

- Replace dev rate limiting with Redis for production.
- Add CSP and observability/structured logging.
