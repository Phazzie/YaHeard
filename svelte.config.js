import autoAdapter from '@sveltejs/adapter-auto';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Use Vercel adapter in CI/non-Windows environments; fallback to auto on Windows local builds to avoid symlink EPERM
    adapter: (process.platform !== 'win32' || process.env.CI || process.env.VERCEL)
      ? vercelAdapter({ maxDuration: 300 })
      : autoAdapter()
  }
};

export default config;