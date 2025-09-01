import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // Use Vercel adapter with configuration for larger payloads
    adapter: adapter({
      maxDuration: 300 // 5 minutes timeout for all API routes
    })
  }
};

export default config;