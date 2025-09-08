export const manifest = (() => {
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
		client: {"start":"_app/immutable/entry/start.C4u96Gvt.js","app":"_app/immutable/entry/app.DPjJvR0X.js","imports":["_app/immutable/entry/start.C4u96Gvt.js","_app/immutable/chunks/entry.BSUBMUjw.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/entry/app.DPjJvR0X.js","_app/immutable/chunks/scheduler.BmpoUOXQ.js","_app/immutable/chunks/index.4lF4fPyg.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/api/merge-chunks/_server.ts.js'))
			},
			{
				id: "/api/transcribe",
				pattern: /^\/api\/transcribe\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/transcribe/_server.ts.js'))
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
