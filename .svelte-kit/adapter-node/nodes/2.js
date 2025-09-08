import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.CylUQ1nV.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/chunks/index.4lF4fPyg.js"];
export const stylesheets = ["_app/immutable/assets/2.BPBGNB_A.css"];
export const fonts = [];
