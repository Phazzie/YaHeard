# Deployment Guide

This project is built with SvelteKit v2, Vite v5, and TypeScript. It is now configured for deployment on DigitalOcean App Platform.

## Adapter

The project uses `@sveltejs/adapter-node` to create a standalone Node.js server application upon build.

## Node.js runtime

- Requires Node.js >= 20.0.0 (see `package.json` engines)
- Package manager: npm

## Environment variables

Copy `.env.example` to `.env` for local development and set at least one API key.

For production on DigitalOcean, define these in the App Spec (`.do/app.yaml`) or in the App Platform dashboard under Settings.

```
OPENAI_API_KEY=
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
```

## Security considerations

- CSRF: Implements a stateless double-submit cookie. Works on serverless—no shared state. Ensure HTTPS in production so the CSRF cookie is marked `secure`.
- Rate limiting: Current implementation uses an in-memory Map for development only. For multi-instance deployments, this should be replaced with Redis or another distributed store.
- Headers: Consider adding Content Security Policy (CSP) and security headers via a middleware or platform settings.

## DigitalOcean App Platform Configuration

This repository is configured for deployment on the DigitalOcean App Platform using the `.do/app.yaml` specification file.

- **Build Command:** `npm run build`
- **Start Command:** `npm start`

The platform will automatically use these scripts to build and launch the application. The app will be served on the port defined by the `PORT` environment variable (defaults to 3000).

To deploy:
1. Create a new App on the DigitalOcean App Platform.
2. Connect your GitHub account and select this repository.
3. The App Platform will detect the `.do/app.yaml` file and use it for configuration.
4. Fill in the required environment variables in the dashboard.
5. Launch the app.

## Local Development

Run the development server:
```bash
npm install
npm run dev
```

To run a production-like build locally:
```bash
npm run build
npm run start
```

## Next steps

- Replace dev rate limiting with Redis for production.
- Add CSP and observability/structured logging.
