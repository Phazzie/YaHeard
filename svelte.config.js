import autoAdapter from '@sveltejs/adapter-auto';
import nodeAdapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Use Node adapter for DigitalOcean App Platform; fallback to auto on Windows local builds to avoid symlink EPERM
    adapter: (process.platform !== 'win32' || process.env.CI || process.env.DO_APP_PLATFORM)
      ? nodeAdapter()
      : autoAdapter()
  }
};

export default config;