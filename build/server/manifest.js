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
		client: {"start":"_app/immutable/entry/start.E0QioKMs.js","app":"_app/immutable/entry/app.CLXs_k2J.js","imports":["_app/immutable/entry/start.E0QioKMs.js","_app/immutable/chunks/entry.CE65BH3d.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/entry/app.CLXs_k2J.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/chunks/index.4lF4fPyg.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./chunks/0-BoJp7-_T.js')),
			__memo(() => import('./chunks/1-BV1e_Oxz.js')),
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
