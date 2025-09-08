const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.CleAvctt.js","app":"_app/immutable/entry/app.kwI5njWV.js","imports":["_app/immutable/entry/start.CleAvctt.js","_app/immutable/chunks/entry.Cyf-0x5I.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/entry/app.kwI5njWV.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/chunks/index.4lF4fPyg.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-BoJp7-_T.js')),
			__memo(() => import('./chunks/1-DyETI9r7.js')),
			__memo(() => import('./chunks/2-B4bARB8c.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/merge-chunks",
				pattern: /^\/api\/merge-chunks\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dz88llo_.js'))
			},
			{
				id: "/api/transcribe",
				pattern: /^\/api\/transcribe\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CMy2lTPP.js'))
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
