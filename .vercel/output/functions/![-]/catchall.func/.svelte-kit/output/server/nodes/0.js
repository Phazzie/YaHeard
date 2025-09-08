

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.VNdtvp4C.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/chunks/index.4lF4fPyg.js"];
export const stylesheets = ["_app/immutable/assets/0.CarLVxO7.css"];
export const fonts = [];
