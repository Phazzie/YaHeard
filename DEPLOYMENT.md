# Deployment Guide

This project is built with SvelteKit v2, Vite v5, and TypeScript. It is configured for flexible deployment to multiple platforms, including **Vercel** and **DigitalOcean App Platform**.

## Core Architecture Notes

### File Uploads
To handle large audio files reliably, this application uses a **direct-to-storage upload** workflow. It requires a cloud storage bucket (like DigitalOcean Spaces or AWS S3) to work correctly. This method bypasses server request size limits present on platforms like Vercel and DigitalOcean.

### SvelteKit Adapters
The project uses a conditional adapter strategy in `svelte.config.js`:
- If the `VERCEL` environment variable is detected, it uses `@sveltejs/adapter-vercel`.
- Otherwise, it defaults to `@sveltejs/adapter-node` for standard Node.js server environments like DigitalOcean.

## Required Configuration

### 1. AI Service API Keys
For transcription, at least one of the following API keys must be provided as an environment variable:
- `OPENAI_API_KEY`
- `ASSEMBLYAI_API_KEY`
- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY`
- `GEMINI_API_KEY`

### 2. Storage Bucket Credentials (Required for all deployments)
For file uploads, you must configure an S3-compatible storage bucket.
- `SPACES_BUCKET_NAME`: The name of your bucket.
- `SPACES_REGION`: The region of your bucket (e.g., `nyc3`).
- `SPACES_ENDPOINT`: The endpoint URL (e.g., `nyc3.digitaloceanspaces.com`).
- `SPACES_ACCESS_KEY_ID`: Your storage access key.
- `SPACES_SECRET_ACCESS_KEY`: Your storage secret key.

See `.env.example` for a full list of variables to set for local development.

---

## Deployment to Vercel

1.  **Fork and Clone:** Fork this repository and clone it locally.
2.  **Vercel Project:** Create a new project on Vercel and link it to your forked repository.
3.  **Environment Variables:** In the Vercel project settings, add all the required environment variables for the AI services and the storage bucket listed above.
4.  **Deploy:** Vercel will automatically detect the SvelteKit framework and deploy the application. The `VERCEL` environment variable will be set automatically, ensuring the correct adapter is used.

---

## Deployment to DigitalOcean App Platform

1.  **Fork and Clone:** Fork this repository and clone it locally.
2.  **DigitalOcean Project:** Create a new App on the DigitalOcean App Platform and link it to your repository.
3.  **Configuration:** The App Platform will detect and use the `.do/app.yaml` file for configuration.
4.  **Environment Variables:** In the App Platform settings, add all the required environment variables.
5.  **Deploy:** Launch the app. The absence of a `VERCEL` variable will correctly trigger the use of the Node adapter.

---

## Local Development

1.  Copy `.env.example` to `.env`.
2.  Fill in the required environment variables in your new `.env` file.
3.  Run the development server:
    ```bash
    npm install
    npm run dev
    ```
4.  To run a production-like build locally (using the Node adapter):
    ```bash
    npm run build
    npm run start
    ```
