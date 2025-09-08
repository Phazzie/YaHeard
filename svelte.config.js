import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Use Vercel adapter if deploying to Vercel, otherwise use Node adapter for DigitalOcean etc.
    adapter: process.env.VERCEL ? vercelAdapter() : nodeAdapter()
  }
};

export default config;