//#region ../blinkid-wasm/src/BlinkIdRecognizerVersion.ts
var e = {
	wasm: {
		simd: {
			full: 4637197,
			lightweight: 4608784
		},
		"simd-threads": {
			full: 4683039,
			lightweight: 4651113
		},
		"simd-relaxed": {
			full: 4629088,
			lightweight: 4600663
		},
		"simd-relaxed-threads": {
			full: 4674931,
			lightweight: 4642993
		}
	},
	data: {
		simd: {
			full: 12778808,
			lightweight: 11143589
		},
		"simd-threads": {
			full: 12778808,
			lightweight: 11143589
		},
		"simd-relaxed": {
			full: 12778808,
			lightweight: 11143589
		},
		"simd-relaxed-threads": {
			full: 12778808,
			lightweight: 11143589
		}
	}
};
//#endregion
//#region ../worker-common/dist/buildResourcePath.js
function t(...e) {
	let t = e.filter((e) => e).join("/").replace(/([^:]\/)\/+/g, "$1");
	try {
		new URL(t, "http://example.com");
	} catch {
		throw Error(`Invalid URL: ${t}`);
	}
	return t;
}
//#endregion
//#region ../worker-common/dist/downloadResourceBuffer.js
var n = class extends Error {
	constructor(e, t) {
		super(e, t === void 0 ? void 0 : { cause: t }), this.name = "ResourceDownloadError";
	}
};
async function r({ url: e, resourceDescription: t, timeoutMs: r, fetchFn: a = fetch }) {
	if (r === void 0) try {
		return await a(e);
	} catch (e) {
		throw i(t, e);
	}
	if (!Number.isSafeInteger(r) || r <= 0) throw Error(`Invalid resource download timeout: ${r}`);
	let o = new AbortController(), s, c, l = () => {
		s !== void 0 && (clearTimeout(s), s = void 0);
	}, u = () => {
		l(), s = setTimeout(() => {
			c = new n(`Timed out downloading ${t} after ${r} ms without receiving data`), o.abort(c);
		}, r);
	};
	u();
	let d;
	try {
		d = await a(e, { signal: o.signal });
	} catch (e) {
		throw l(), c ?? i(t, e);
	}
	if (!d.body) return l(), d;
	u();
	let f = d.body.getReader(), p = new ReadableStream({
		async pull(e) {
			try {
				let { done: t, value: n } = await f.read();
				if (t) {
					l(), e.close();
					return;
				}
				u(), e.enqueue(n);
			} catch (n) {
				l(), e.error(c ?? i(t, n));
			}
		},
		async cancel(e) {
			l();
			try {
				await f.cancel(e);
			} finally {
				o.abort(e);
			}
		}
	});
	return new Response(p, d);
}
function i(e, t) {
	return new n(`Failed to download ${e}${t instanceof Error && t.message ? `: ${t.message}` : ""}`, t);
}
async function a(e, t) {
	let { url: i, fileType: a, variant: o, buildType: s, progressCallback: c, timeoutMs: l } = e, u = e.resourceDescription, d = u === void 0 && l === void 0 ? await fetch(i) : await r({
		url: i,
		resourceDescription: u ?? `${a} resource`,
		timeoutMs: l
	});
	if (u !== void 0 && !d.ok) throw await d.body?.cancel(), new n(`Failed to download ${u}: ${d.status} ${d.statusText}`);
	if (!c) return d;
	let f = d.headers.get("Content-Length"), p = f ? parseInt(f, 10) : t({
		fileType: a,
		variant: o,
		buildType: s
	});
	if (isNaN(p) || p < 0) throw Error(`Invalid content length for ${a} file: ${p}`);
	let m = 0, h = new TransformStream({
		transform(e, t) {
			m += e.length;
			let n = Math.min(Math.round(m / p * 100), 100);
			c({
				loaded: m,
				contentLength: p,
				progress: n,
				finished: !1
			}), t.enqueue(e);
		},
		flush() {
			c({
				loaded: m,
				contentLength: p,
				progress: 100,
				finished: !0
			});
		}
	});
	return new Response(d.body?.pipeThrough(h), d);
}
async function o(e, t) {
	return (await a(e, t)).arrayBuffer();
}
//#endregion
//#region ../worker-common/dist/compileWasm.js
var s = "application/wasm";
async function c(e, t) {
	if (!d(e)) return WebAssembly.compile(await e.arrayBuffer());
	try {
		return await WebAssembly.compileStreaming(e);
	} catch (e) {
		if (e instanceof n || !t) throw e;
		console.warn("Streaming compilation failed, retrying with buffered compilation", e);
		let r = await t();
		return WebAssembly.compile(await r.arrayBuffer());
	}
}
async function l(e, t) {
	let n, r = e.progressCallback ? (t) => {
		n = {
			loaded: Math.max(n?.loaded ?? 0, t.loaded),
			contentLength: t.contentLength,
			progress: Math.max(n?.progress ?? 0, t.progress),
			finished: !1
		}, e.progressCallback?.(n);
	} : void 0, i = () => a({
		...e,
		progressCallback: r
	}, t), o = await i().then((e) => c(e, i));
	return n && e.progressCallback && e.progressCallback({
		loaded: n.loaded,
		contentLength: n.contentLength,
		progress: 100,
		finished: !0
	}), o;
}
function u(e) {
	return (t, n) => {
		let r = new WebAssembly.Instance(e, t);
		return n(r, e), r.exports;
	};
}
function d(e) {
	return typeof WebAssembly.compileStreaming == "function" && e.headers.get("Content-Type") === s;
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/typeof.js
function f(e) {
	"@babel/helpers - typeof";
	return f = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, f(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/toPrimitive.js
function p(e, t) {
	if (f(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (f(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/toPropertyKey.js
function m(e) {
	var t = p(e, "string");
	return f(t) == "symbol" ? t : t + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/defineProperty.js
function h(e, t, n) {
	return (t = m(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region ../worker-common/dist/errors.js
var g = class extends Error {
	constructor(e) {
		super(e), h(this, "code", "SERVER_PERMISSION_ERROR"), this.name = "ServerPermissionError";
	}
}, ee = class extends Error {
	constructor(e) {
		super(e), h(this, "code", "LICENSE_ERROR"), this.name = "LicenseError";
	}
}, _ = "application/javascript", te = (e, t = {}) => {
	let n = {
		skipSameOrigin: !0,
		useBlob: !0,
		...t
	};
	return n.skipSameOrigin && new URL(e).origin === self.location.origin ? Promise.resolve(e) : new Promise((t, r) => void fetch(e).then((e) => e.text()).then((r) => {
		new URL(e).href.split("/").pop();
		let i = "";
		if (n.useBlob) {
			let e = new Blob([r], { type: _ });
			i = URL.createObjectURL(e);
		} else i = `data:${_},` + encodeURIComponent(r);
		t(i);
	}).catch(r));
};
//#endregion
//#region ../worker-common/dist/getWasmFileSize.js
function ne(e, t) {
	let n = t[e.fileType][e.variant];
	if (typeof n == "number") return n;
	if (e.buildType === void 0) throw Error("buildType is required when size manifest entry is build-aware");
	return n[e.buildType];
}
//#endregion
//#region ../worker-common/dist/isSafari.js
function re() {
	let e = self.navigator.userAgent.toLowerCase();
	return /iphone|ipad|ipod/.test(e);
}
//#endregion
//#region ../worker-common/dist/licencing.js
function v(e) {
	return {
		licenseId: e.licenseId,
		licensee: e.licensee,
		applicationIds: e.applicationIds,
		packageName: e.packageName,
		platform: "Browser",
		sdkName: e.sdkName,
		sdkVersion: e.sdkVersion
	};
}
async function y(e, t = "https://baltazar.microblink.com/api/v2/status/check") {
	if (!t || typeof t != "string") throw Error("Invalid baltazarUrl: must be a non-empty string");
	try {
		new URL(t);
	} catch {
		throw Error(`Invalid baltazarUrl format: ${t}`);
	}
	try {
		let n = await fetch(t, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			cache: "no-cache",
			body: JSON.stringify(v(e))
		});
		if (!n.ok) throw Error(`Server returned error: ${n.status} ${n.statusText}`);
		return await n.text();
	} catch (e) {
		throw console.error("Server permission request failed:", e), e;
	}
}
//#endregion
//#region ../worker-common/dist/mbToWasmPages.js
function ie(e) {
	return Math.ceil(e * 1024 * 1024 / 64 / 1024);
}
//#endregion
//#region ../worker-common/dist/proxy-url-validator.js
var b = class extends Error {
	constructor(e, t, n) {
		super(`Proxy URL validation failed for "${n}": ${t}`), h(this, "code", void 0), h(this, "url", void 0), this.code = e, this.url = n, this.name = "ProxyUrlValidationError";
	}
};
function ae(e) {
	let t = e.unlockResult === "requires-server-permission", { allowPingProxy: n, allowBaltazarProxy: r, hasPing: i } = e;
	if (!n && !r || !t && !i || !t && i && r && !n || t && !i && !r && n) throw Error("Microblink proxy URL is set but your license doesn't permit proxy usage. Check your license.");
}
function oe(e) {
	let t;
	try {
		t = new URL(e);
	} catch {
		throw new b("INVALID_PROXY_URL", `Failed to create URL instance for provided Microblink proxy URL "${e}". Expected format: https://your-proxy.com or https://your-proxy.com/`, e);
	}
	if (t.protocol !== "https:") throw new b("HTTPS_REQUIRED", `Proxy URL validation failed for "${e}": HTTPS protocol must be used. Expected format: https://your-proxy.com or https://your-proxy.com/`, e);
	let n = t.origin;
	try {
		let e = new URL(`${t.pathname}${t.pathname.endsWith("/") ? "" : "/"}api/v2/status/check`, n).toString();
		return {
			ping: n + t.pathname.replace(/\/$/, ""),
			baltazar: e
		};
	} catch {
		throw new b("INVALID_PROXY_URL", "Failed to build baltazar service URL", e);
	}
}
function x(e, t) {
	let n = !!e, r = t.unlockResult === "requires-server-permission";
	return {
		pingProxyEnabled: n && t.allowPingProxy && t.hasPing,
		baltazarProxyEnabled: r && n && t.allowBaltazarProxy
	};
}
//#endregion
//#region ../../node_modules/.pnpm/wasm-feature-detect@1.9.0/node_modules/wasm-feature-detect/dist/esm/index.js
var se = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	4,
	1,
	96,
	0,
	0,
	3,
	2,
	1,
	0,
	5,
	3,
	1,
	0,
	1,
	10,
	14,
	1,
	12,
	0,
	65,
	0,
	65,
	0,
	65,
	0,
	252,
	10,
	0,
	0,
	11
])), ce = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	2,
	8,
	1,
	1,
	97,
	1,
	98,
	3,
	127,
	1,
	6,
	6,
	1,
	127,
	1,
	65,
	0,
	11,
	7,
	5,
	1,
	1,
	97,
	3,
	1
])), le = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	4,
	1,
	96,
	0,
	0,
	3,
	2,
	1,
	0,
	10,
	7,
	1,
	5,
	0,
	208,
	112,
	26,
	11
])), ue = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	5,
	1,
	96,
	0,
	1,
	123,
	3,
	2,
	1,
	0,
	10,
	15,
	1,
	13,
	0,
	65,
	1,
	253,
	15,
	65,
	2,
	253,
	15,
	253,
	128,
	2,
	11
])), de = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	4,
	1,
	96,
	0,
	0,
	3,
	2,
	1,
	0,
	10,
	12,
	1,
	10,
	0,
	67,
	0,
	0,
	0,
	0,
	252,
	0,
	26,
	11
])), fe = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	4,
	1,
	96,
	0,
	0,
	3,
	2,
	1,
	0,
	10,
	8,
	1,
	6,
	0,
	65,
	0,
	192,
	26,
	11
])), pe = async () => WebAssembly.validate(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	5,
	1,
	96,
	0,
	1,
	123,
	3,
	2,
	1,
	0,
	10,
	10,
	1,
	8,
	0,
	65,
	0,
	253,
	15,
	253,
	98,
	11
])), me = () => (async (e) => {
	try {
		return typeof MessageChannel < "u" && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(e);
	} catch {
		return !1;
	}
})(new Uint8Array([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	4,
	1,
	96,
	0,
	0,
	3,
	2,
	1,
	0,
	5,
	4,
	1,
	3,
	1,
	1,
	10,
	11,
	1,
	9,
	0,
	65,
	0,
	254,
	16,
	2,
	0,
	26,
	11
]));
//#endregion
//#region ../worker-common/dist/wasm-feature-detect.js
function he() {
	let e = navigator.userAgent.toLowerCase();
	return e.includes("safari") && !e.includes("chrome");
}
async function ge() {
	if (!await me()) return !1;
	if (!("importScripts" in self)) throw Error("Not implemented");
	return !he() && "Worker" in self;
}
async function _e() {
	return ue();
}
async function ve(e = {}) {
	let { allowRelaxedSimd: t = !0 } = e, n = [
		ce(),
		le(),
		se(),
		de(),
		fe(),
		pe()
	];
	if (!(await Promise.all(n)).every(Boolean)) throw Error("Browser doesn't meet minimum requirements!");
	let r = t && await _e(), i = await ge();
	return r ? i ? "simd-relaxed-threads" : "simd-relaxed" : i ? "simd-threads" : "simd";
}
//#endregion
//#region ../worker-common/dist/wasmVariant.js
function ye(e, t) {
	return e ? `lightweight-${t}` : t;
}
function be(e) {
	switch (e) {
		case "simd-relaxed-threads":
		case "simd-threads": return !0;
		default: return !1;
	}
}
//#endregion
//#region ../worker-common/dist/workerCrashReporter.js
function xe({ workerScope: e, getSessionNumber: t, onError: n }) {
	let r = e ?? self, i = t ?? (() => 0), a = !1, o = (e, t) => {
		if (!a) {
			a = !0;
			try {
				n({
					origin: e,
					error: t,
					sessionNumber: i()
				});
			} finally {
				a = !1;
			}
		}
	}, s = (e) => {
		let t = e;
		o("worker.onerror", t.error ?? t.message ?? "Unknown worker error");
	}, c = (e) => {
		o("worker.unhandledrejection", e.reason ?? "Unhandled worker rejection");
	};
	return r.addEventListener("error", s), r.addEventListener("unhandledrejection", c), () => {
		r.removeEventListener("error", s), r.removeEventListener("unhandledrejection", c);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/comlink@4.4.2/node_modules/comlink/dist/esm/comlink.mjs
var Se = Symbol("Comlink.proxy"), Ce = Symbol("Comlink.endpoint"), we = Symbol("Comlink.releaseProxy"), S = Symbol("Comlink.finalizer"), C = Symbol("Comlink.thrown"), Te = (e) => typeof e == "object" && !!e || typeof e == "function", Ee = /* @__PURE__ */ new Map([["proxy", {
	canHandle: (e) => Te(e) && e[Se],
	serialize(e) {
		let { port1: t, port2: n } = new MessageChannel();
		return Oe(e, t), [n, [n]];
	},
	deserialize(e) {
		return e.start(), je(e);
	}
}], ["throw", {
	canHandle: (e) => Te(e) && C in e,
	serialize({ value: e }) {
		let t;
		return t = e instanceof Error ? {
			isError: !0,
			value: {
				message: e.message,
				name: e.name,
				stack: e.stack
			}
		} : {
			isError: !1,
			value: e
		}, [t, []];
	},
	deserialize(e) {
		throw e.isError ? Object.assign(Error(e.value.message), e.value) : e.value;
	}
}]]);
function De(e, t) {
	for (let n of e) if (t === n || n === "*" || n instanceof RegExp && n.test(t)) return !0;
	return !1;
}
function Oe(e, t = globalThis, n = ["*"]) {
	t.addEventListener("message", function r(i) {
		if (!i || !i.data) return;
		if (!De(n, i.origin)) {
			console.warn(`Invalid origin '${i.origin}' for comlink proxy`);
			return;
		}
		let { id: a, type: o, path: s } = Object.assign({ path: [] }, i.data), c = (i.data.argumentList || []).map(A), l;
		try {
			let t = s.slice(0, -1).reduce((e, t) => e[t], e), n = s.reduce((e, t) => e[t], e);
			switch (o) {
				case "GET":
					l = n;
					break;
				case "SET":
					t[s.slice(-1)[0]] = A(i.data.value), l = !0;
					break;
				case "APPLY":
					l = n.apply(t, c);
					break;
				case "CONSTRUCT":
					l = O(new n(...c));
					break;
				case "ENDPOINT":
					{
						let { port1: t, port2: n } = new MessageChannel();
						Oe(e, n), l = Re(t, [t]);
					}
					break;
				case "RELEASE":
					l = void 0;
					break;
				default: return;
			}
		} catch (e) {
			l = {
				value: e,
				[C]: 0
			};
		}
		Promise.resolve(l).catch((e) => ({
			value: e,
			[C]: 0
		})).then((n) => {
			let [i, s] = k(n);
			t.postMessage(Object.assign(Object.assign({}, i), { id: a }), s), o === "RELEASE" && (t.removeEventListener("message", r), Ae(t), S in e && typeof e[S] == "function" && e[S]());
		}).catch((e) => {
			let [n, r] = k({
				value: /* @__PURE__ */ TypeError("Unserializable return value"),
				[C]: 0
			});
			t.postMessage(Object.assign(Object.assign({}, n), { id: a }), r);
		});
	}), t.start && t.start();
}
function ke(e) {
	return e.constructor.name === "MessagePort";
}
function Ae(e) {
	ke(e) && e.close();
}
function je(e, t) {
	let n = /* @__PURE__ */ new Map();
	return e.addEventListener("message", function(e) {
		let { data: t } = e;
		if (!t || !t.id) return;
		let r = n.get(t.id);
		if (r) try {
			r(t);
		} finally {
			n.delete(t.id);
		}
	}), D(e, n, [], t);
}
function w(e) {
	if (e) throw Error("Proxy has been released and is not useable");
}
function Me(e) {
	return j(e, /* @__PURE__ */ new Map(), { type: "RELEASE" }).then(() => {
		Ae(e);
	});
}
var T = /* @__PURE__ */ new WeakMap(), E = "FinalizationRegistry" in globalThis && new FinalizationRegistry((e) => {
	let t = (T.get(e) || 0) - 1;
	T.set(e, t), t === 0 && Me(e);
});
function Ne(e, t) {
	let n = (T.get(t) || 0) + 1;
	T.set(t, n), E && E.register(e, t, e);
}
function Pe(e) {
	E && E.unregister(e);
}
function D(e, t, n = [], r = function() {}) {
	let i = !1, a = new Proxy(r, {
		get(r, o) {
			if (w(i), o === we) return () => {
				Pe(a), Me(e), t.clear(), i = !0;
			};
			if (o === "then") {
				if (n.length === 0) return { then: () => a };
				let r = j(e, t, {
					type: "GET",
					path: n.map((e) => e.toString())
				}).then(A);
				return r.then.bind(r);
			}
			return D(e, t, [...n, o]);
		},
		set(r, a, o) {
			w(i);
			let [s, c] = k(o);
			return j(e, t, {
				type: "SET",
				path: [...n, a].map((e) => e.toString()),
				value: s
			}, c).then(A);
		},
		apply(r, a, o) {
			w(i);
			let s = n[n.length - 1];
			if (s === Ce) return j(e, t, { type: "ENDPOINT" }).then(A);
			if (s === "bind") return D(e, t, n.slice(0, -1));
			let [c, l] = Ie(o);
			return j(e, t, {
				type: "APPLY",
				path: n.map((e) => e.toString()),
				argumentList: c
			}, l).then(A);
		},
		construct(r, a) {
			w(i);
			let [o, s] = Ie(a);
			return j(e, t, {
				type: "CONSTRUCT",
				path: n.map((e) => e.toString()),
				argumentList: o
			}, s).then(A);
		}
	});
	return Ne(a, e), a;
}
function Fe(e) {
	return Array.prototype.concat.apply([], e);
}
function Ie(e) {
	let t = e.map(k);
	return [t.map((e) => e[0]), Fe(t.map((e) => e[1]))];
}
var Le = /* @__PURE__ */ new WeakMap();
function Re(e, t) {
	return Le.set(e, t), e;
}
function O(e) {
	return Object.assign(e, { [Se]: !0 });
}
function k(e) {
	for (let [t, n] of Ee) if (n.canHandle(e)) {
		let [r, i] = n.serialize(e);
		return [{
			type: "HANDLER",
			name: t,
			value: r
		}, i];
	}
	return [{
		type: "RAW",
		value: e
	}, Le.get(e) || []];
}
function A(e) {
	switch (e.type) {
		case "HANDLER": return Ee.get(e.name).deserialize(e.value);
		case "RAW": return e.value;
	}
}
function j(e, t, n, r) {
	return new Promise((i) => {
		let a = ze();
		t.set(a, i), e.start && e.start(), e.postMessage(Object.assign({ id: a }, n), r);
	});
}
function ze() {
	return [
		,
		,
		,
		,
	].fill(0).map(() => Math.floor(Math.random() * (2 ** 53 - 1)).toString(16)).join("-");
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/checkPrivateRedeclaration.js
function Be(e, t) {
	if (t.has(e)) throw TypeError("Cannot initialize the same private elements twice on an object");
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/classPrivateMethodInitSpec.js
function Ve(e, t) {
	Be(e, t), t.add(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/classPrivateFieldInitSpec.js
function M(e, t, n) {
	Be(e, t), t.set(e, n);
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/assertClassBrand.js
function N(e, t, n) {
	if (typeof e == "function" ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
	throw TypeError("Private element is not present on this object");
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/classPrivateFieldSet2.js
function P(e, t, n) {
	return e.set(N(e, t), n), n;
}
//#endregion
//#region \0@oxc-project+runtime@0.142.0/helpers/esm/classPrivateFieldGet2.js
function F(e, t) {
	return e.get(N(e, t));
}
//#endregion
//#region src/BlinkIdInitializationProgress.ts
var He = 32, I = /* @__PURE__ */ new WeakMap(), L = /* @__PURE__ */ new WeakMap(), R = /* @__PURE__ */ new WeakMap(), z = /* @__PURE__ */ new WeakMap(), B = /* @__PURE__ */ new WeakMap(), V = /* @__PURE__ */ new WeakMap(), H = /* @__PURE__ */ new WeakSet(), Ue = class {
	constructor(e, t) {
		Ve(this, H), M(this, I, void 0), M(this, L, /* @__PURE__ */ new Map()), M(this, R, 0), M(this, z, 0), M(this, B, 0), M(this, V, 0), P(I, this, e), N(H, this, We).call(this, t);
	}
	updateWasm(e, t, n = !1) {
		P(B, this, e.loaded + t.loaded), P(V, this, e.contentLength + t.contentLength), N(H, this, W).call(this, N(H, this, U).call(this), !1, n);
	}
	setSelectedOtaResources(e) {
		N(H, this, We).call(this, e), N(H, this, W).call(this, N(H, this, U).call(this), !1, !0);
	}
	updateOta(e, t) {
		let n = F(L, this).get(e);
		if (!n) return;
		let r = !t.finished && t.loaded === 0;
		n.loaded = r || t.finished ? t.loaded : Math.max(n.loaded, t.loaded), t.contentLength > 0 && (n.contentLength = t.finished || r ? t.contentLength : Math.max(n.contentLength, t.contentLength)), N(H, this, W).call(this, N(H, this, U).call(this), !1);
	}
	complete() {
		N(H, this, W).call(this, 100, !0, !0);
	}
};
function We(e) {
	F(L, this).clear();
	for (let t of e) {
		let e = t.contentLength;
		if (e === void 0 || !Number.isSafeInteger(e) || e <= 0) throw Error(`BlinkID OTA resource ${t.filename} is missing a valid contentLength`);
		F(L, this).set(t.filename, {
			loaded: 0,
			contentLength: e
		});
	}
}
function U() {
	let e = Array.from(F(L, this).values()), t = e.reduce((e, t) => e + t.contentLength, 0), n = F(V, this) + t;
	if (n === 0) return 0;
	let r = e.reduce((e, t) => e + Math.min(t.loaded, t.contentLength), 0);
	return Math.min(Math.round((F(B, this) + r) / n * 100), 100);
}
function W(e, t, n = !1) {
	let r = performance.now();
	if (!n && r - F(z, this) < He) return;
	P(z, this, r), P(R, this, t ? 100 : Math.max(F(R, this), Math.min(e, 99)));
	let i = Array.from(F(L, this).values());
	F(I, this).call(this, {
		loaded: F(B, this) + i.reduce((e, t) => e + t.loaded, 0),
		contentLength: F(V, this) + i.reduce((e, t) => e + t.contentLength, 0),
		progress: F(R, this),
		finished: t
	});
}
//#endregion
//#region src/otaResources.ts
var Ge = "api/v1/versions", Ke = "/api/v1/versions", qe = "/microblink/blinkid-ota", Je = "ota-resources.json", Ye = {
	embedder_engine: "serialized-embedder-database.bin",
	template_engine: "template-database.zzip",
	document_knowledge_engine: "knowledge-database.zzip"
}, Xe = new Set(Object.values(Ye));
function Ze(e) {
	let t = e.trim().replace(/\/+$/, "");
	return t.endsWith(Ke) ? t.slice(0, -16).replace(/\/+$/, "") : t;
}
async function Qe({ resourcesLocation: e, fetchFn: n = fetch, timeoutMs: i }) {
	let a = e.trim().replace(/\/+$/, "");
	if (!a) throw Error("BlinkID OTA resources location is empty");
	let o = await r({
		url: t(a, Je),
		resourceDescription: "BlinkID OTA resources manifest",
		timeoutMs: i,
		fetchFn: n
	});
	if (!o.ok) throw await o.body?.cancel(), Error(`Failed to resolve BlinkID OTA resources manifest: ${o.status} ${o.statusText}`);
	let s = await o.json();
	if (!Array.isArray(s.resources) || s.resources.length === 0) throw Error("BlinkID OTA resources manifest is missing resources");
	let c = s.resources.map((e, t) => lt(e ?? void 0, t, a));
	return ut(c), c;
}
function $e(e, t) {
	let n = new Map(t.map((e) => [e.filename, e]));
	return e.map((e) => {
		let t = n.get(e.filename);
		return !t || ht(t.version, e.version) <= 0 ? e : {
			...t,
			...e.contentLength === void 0 ? {} : { contentLength: e.contentLength },
			fallbackUrl: e.url
		};
	});
}
async function et({ resourceProviderUrl: e, genericVersion: t, fetchFn: n = fetch, timeoutMs: i }) {
	let a = Ze(e), o = new URL(Ge, a.endsWith("/") ? a : `${a}/`);
	o.searchParams.set("generic_version", t);
	let s = await r({
		url: o.toString(),
		resourceDescription: "BlinkID OTA provider response",
		timeoutMs: i,
		fetchFn: n
	});
	if (!s.ok) throw await s.body?.cancel(), Error(`Failed to resolve BlinkID OTA resources: ${s.status} ${s.statusText}`);
	let c = await s.json();
	return [
		K(c.embedder_engine, "embedder_engine"),
		K(c.template_engine, "template_engine"),
		K(c.document_knowledge_engine, "document_knowledge_engine")
	];
}
async function tt({ resources: e, directory: t = qe, fetchFn: n = fetch, fallbackOnError: r = !1, progressCallback: i, timeoutMs: a }) {
	let o = await Promise.all(e.map(async (e) => {
		let t = 0, o = i ? (n) => {
			t = Math.max(t, n.progress), i(e.filename, {
				...n,
				progress: t
			});
		} : void 0, s = await nt({
			resource: e,
			fetchFn: n,
			fallbackOnError: r,
			timeoutMs: a
		});
		at(s.response, o, s.resource.contentLength);
		let c = await rt({
			download: s,
			fetchFn: n,
			fallbackOnError: r,
			progressCallback: o,
			timeoutMs: a
		});
		return {
			data: new Uint8Array(c),
			resource: s.resource
		};
	}));
	return (e) => {
		vt(e, t);
		for (let { data: n, resource: r } of o) yt(e, t, r.filename, n), bt(e, `${t}/${r.filename}`, n.byteLength), i?.(r.filename, {
			loaded: n.byteLength,
			contentLength: n.byteLength,
			progress: 100,
			finished: !0
		});
		return t;
	};
}
async function nt({ resource: e, fetchFn: t, fallbackOnError: n, timeoutMs: r }) {
	try {
		return {
			resource: e,
			response: await G(e.filename, e.url, t, r),
			usingFallback: !1
		};
	} catch (i) {
		if (!n || !e.fallbackUrl) throw i;
		return ct(e.filename, i), {
			resource: e,
			response: await G(e.filename, e.fallbackUrl, t, r),
			usingFallback: !0
		};
	}
}
async function rt({ download: e, fetchFn: t, fallbackOnError: n, progressCallback: r, timeoutMs: i }) {
	try {
		return await it(e.resource.filename, e.response, r, e.resource.contentLength);
	} catch (a) {
		if (e.usingFallback || !n || !e.resource.fallbackUrl) throw a;
		ct(e.resource.filename, a);
		let o = await G(e.resource.filename, e.resource.fallbackUrl, t, i);
		return at(o, r, e.resource.contentLength), it(e.resource.filename, o, r, e.resource.contentLength);
	}
}
async function G(e, t, n, i) {
	let a = await r({
		url: t,
		resourceDescription: `BlinkID OTA resource ${e}`,
		timeoutMs: i,
		fetchFn: n
	});
	if (!a.ok) throw await a.body?.cancel(), Error(`Failed to download BlinkID OTA resource ${e}: ${a.status} ${a.statusText}`);
	return a;
}
async function it(e, t, n, r) {
	let i = await ot(t, n, r);
	if (i.byteLength === 0) throw Error(`Failed to download BlinkID OTA resource ${e}: empty response body`);
	return i;
}
function at(e, t, n) {
	t && t({
		loaded: 0,
		contentLength: st(e, n),
		progress: 0,
		finished: !1
	});
}
async function ot(e, t, n) {
	if (!t || !e.body) return e.arrayBuffer();
	let r = st(e, n), i = 0, a = new TransformStream({ transform(e, n) {
		i += e.byteLength, t({
			loaded: i,
			contentLength: r,
			progress: r > 0 ? Math.min(Math.round(i / r * 100), 100) : 0,
			finished: !1
		}), n.enqueue(e);
	} });
	return new Response(e.body.pipeThrough(a), e).arrayBuffer();
}
function st(e, t = 0) {
	let n = e.headers?.get?.("Content-Length"), r = n ? Number.parseInt(n, 10) : 0;
	return Number.isFinite(r) && r > 0 ? r : t;
}
function ct(e, t) {
	console.warn(`BlinkID OTA provider resource ${e} was not loaded. Falling back to the hosted resource.`, t);
}
function K(e, t) {
	let n = pt(e, t);
	return {
		filename: Ye[t],
		version: mt(e, t),
		url: n
	};
}
function lt(e, t, n) {
	let r = _t(e?.filename);
	if (!r) throw Error(`BlinkID OTA resources manifest entry ${t} is missing filename`);
	let i = e?.version?.trim();
	if (!i) throw Error(`BlinkID OTA resources manifest entry ${t} is missing version`);
	let a = e?.contentLength;
	if (a === void 0) throw Error(`BlinkID OTA resources manifest entry ${t} is missing contentLength`);
	if (!Number.isSafeInteger(a) || a <= 0) throw Error(`BlinkID OTA resources manifest entry ${t} has invalid contentLength`);
	return {
		filename: r,
		version: i,
		url: dt(n, r, e?.url),
		contentLength: a
	};
}
function ut(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		if (!Xe.has(n.filename)) throw Error(`BlinkID OTA resources manifest contains unexpected resource ${n.filename}`);
		if (t.has(n.filename)) throw Error(`BlinkID OTA resources manifest contains duplicate resource ${n.filename}`);
		t.add(n.filename);
	}
	let n = [...Xe].filter((e) => !t.has(e));
	if (n.length > 0) throw Error(`BlinkID OTA resources manifest is missing required resources: ${n.join(", ")}`);
}
function dt(e, n, r) {
	let i = r?.trim();
	return i ? ft(i) ? i : t(e, i) : t(e, n);
}
function ft(e) {
	try {
		return new URL(e), !0;
	} catch {
		return !1;
	}
}
function pt(e, t) {
	let n = e?.db_download_link;
	if (!n) throw Error(`BlinkID OTA response is missing ${t}.db_download_link`);
	return n;
}
function mt(e, t) {
	let n = e?.latest_version?.trim();
	if (!n) throw Error(`BlinkID OTA response is missing ${t}.latest_version`);
	return n;
}
function ht(e, t) {
	let n = gt(e), r = gt(t);
	for (let e = 0; e < n.length; e++) {
		let t = n[e] - r[e];
		if (t !== 0) return t;
	}
	return 0;
}
function gt(e) {
	let t = /^(\d+)\.(\d+)\.(\d+)$/.exec(e);
	if (!t) throw Error(`Invalid BlinkID OTA resource version: ${e}`);
	return [
		Number(t[1]),
		Number(t[2]),
		Number(t[3])
	];
}
function _t(e) {
	let t = e?.split(/[\\/]/).filter(Boolean).at(-1)?.trim();
	if (!(!t || t === "." || t === "..")) return t;
}
function vt(e, t) {
	if (typeof e.FS?.mkdirTree == "function") {
		e.FS.mkdirTree(t);
		return;
	}
	if (!e.FS_createPath) throw Error("Loaded BlinkID Wasm module does not expose Emscripten filesystem path creation");
	let n = t.split("/").filter(Boolean), r = "/";
	for (let t of n) {
		try {
			e.FS_createPath(r, t, !0, !0);
		} catch {}
		r = r === "/" ? `/${t}` : `${r}/${t}`;
	}
}
function yt(e, t, n, r) {
	if (typeof e.FS?.writeFile == "function") {
		e.FS.writeFile(`${t}/${n}`, r);
		return;
	}
	if (!e.FS_createDataFile) throw Error("Loaded BlinkID Wasm module does not expose Emscripten filesystem file creation");
	try {
		e.FS_unlink?.(`${t}/${n}`);
	} catch {}
	e.FS_createDataFile(t, n, r, !0, !0, !0);
}
function bt(e, t, n) {
	if (!e.FS?.readFile) return;
	let r = e.FS.readFile(t);
	if (r.byteLength !== n) throw Error(`BlinkID OTA MEMFS write verification failed for ${t}: expected ${n} bytes, got ${r.byteLength}`);
}
//#endregion
//#region src/utils.ts
function xt(e, t) {
	return {
		...t,
		redactBarcode: t.redactBarcode ?? e.redactBarcode,
		redactMrz: t.redactMrz ?? e.redactMrz,
		fields: t.fields ?? e.fields,
		mode: t.mode ?? e.mode
	};
}
//#endregion
//#region src/BlinkIdWorker.ts
var St = "FrameTransferError", Ct = "https://blinkid-ota.microblink.com";
function wt(e) {
	let t = e?.resourcesLocation?.trim(), n = e?.otaResourceProviderUrl?.trim(), r = Ct;
	return n && (r = n), {
		checkForUpdates: e?.checkForUpdates ?? !0,
		otaResourceProviderUrl: r,
		...t ? { resourcesLocation: t } : {},
		strict: e?.strict ?? !1
	};
}
function Tt(e) {
	let t = e ?? 6e4;
	if (!Number.isSafeInteger(t) || t <= 0) throw Error(`Invalid BlinkID resource download timeout: ${t}`);
	return t;
}
var Et = {
	fields: [],
	mode: "full-result",
	redactBarcode: !1,
	redactMrz: !1
}, Dt = (e, t) => {
	let n = t instanceof Error && t.message ? `: ${t.message}` : "", r = Error(`${e}${n}`, t instanceof Error ? { cause: t } : void 0);
	return r.name = St, r;
}, q = /* @__PURE__ */ new WeakMap(), J = /* @__PURE__ */ new WeakMap(), Ot = /* @__PURE__ */ new WeakMap(), kt = /* @__PURE__ */ new WeakMap(), Y = /* @__PURE__ */ new WeakMap(), X = /* @__PURE__ */ new WeakMap(), Z = /* @__PURE__ */ new WeakMap(), Q = /* @__PURE__ */ new WeakMap(), $ = /* @__PURE__ */ new WeakSet(), At = class {
	constructor() {
		Ve(this, $), M(this, q, void 0), M(this, J, void 0), h(this, "progressStatusCallback", void 0), M(this, Ot, !0), M(this, kt, !0), M(this, Y, 0), M(this, X, void 0), M(this, Z, void 0), M(this, Q, void 0), P(Q, this, xe({
			getSessionNumber: () => F(Y, this),
			onError: ({ error: e, sessionNumber: t }) => {
				F(q, this) && (this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: t,
					data: {
						errorType: "Crash",
						errorMessage: e instanceof Error ? e.message : String(e),
						stackTrace: e instanceof Error ? e.stack : void 0
					}
				}), this.sendPinglets());
			}
		}));
	}
	reportPinglet(e) {
		if (!F(q, this)) throw Error("Cannot report pinglet: Wasm module not loaded");
		try {
			F(q, this).queuePinglet(JSON.stringify(e.data), e.schemaName, e.schemaVersion, e.sessionNumber ?? F(Y, this));
		} catch (t) {
			console.warn("Failed to queue pinglet:", t, e);
		}
	}
	sendPinglets() {
		if (!F(q, this)) throw Error("Cannot send pinglets: Wasm module not loaded");
		try {
			F(q, this).sendPinglets();
		} catch (e) {
			console.warn("Failed to send pinglets:", e);
		}
	}
	async initBlinkId(e, t) {
		let n = new URL("resources/", e.resourcesLocation).toString();
		this.progressStatusCallback = t, P(Z, this, e.userId);
		let r = Tt(e.resourceDownloadTimeoutMs), i = await N($, this, Nt).call(this, e.otaResources, n, r), a = this.progressStatusCallback ? new Ue(this.progressStatusCallback, i) : void 0, o = e.wasmVariant ?? await ve(), s = e.useLightweightBuild ? "lightweight" : "full", c = N($, this, Mt).call(this, e.otaResources, i, r, a), l = N($, this, jt).call(this, {
			resourceUrl: n,
			wasmVariant: o,
			featureVariant: s,
			initialMemory: e.initialMemory,
			resourceDownloadTimeoutMs: r
		}, a), [, u] = await Promise.all([l, c]);
		if (!F(q, this)) throw Error("Wasm module not loaded");
		u(F(q, this)), a?.complete();
		let d = F(q, this).initializeWithLicenseKey(e.licenseKey, e.userId, !1);
		if (this.reportPinglet({
			schemaName: "ping.sdk.init.start",
			schemaVersion: "3.0.0",
			sessionNumber: 0,
			data: {
				packageName: self.location.hostname,
				platform: "Emscripten",
				platformDetails: ye(e.useLightweightBuild, o),
				product: "BlinkID",
				userId: F(Z, this),
				...x(e.microblinkProxyUrl, d)
			}
		}), d.licenseError) throw new ee("License unlock error: " + d.licenseError);
		if (e.microblinkProxyUrl && (ae(d), P(X, this, oe(e.microblinkProxyUrl)), d.allowPingProxy && d.hasPing && (F(q, this).setPingProxyUrl(F(X, this).ping), console.debug(`Using ping proxy URL: ${F(X, this).ping}`))), d.unlockResult === "requires-server-permission") {
			let e = F(X, this)?.baltazar && d.allowBaltazarProxy ? F(X, this)?.baltazar : void 0;
			e && console.debug(`Using Baltazar proxy URL: ${e}`);
			let t = e ? await y(d, e) : await y(d), n = F(q, this).submitServerPermission(t);
			if (n?.error) throw new g("Server unlock error: " + n.error);
		}
		try {
			console.debug(`BlinkID SDK ${d.sdkVersion} unlocked`), P(Ot, this, d.showDemoOverlay), P(kt, this, d.showProductionOverlay), F(q, this).initializeSdk(e.userId);
		} catch (e) {
			throw console.warn("Failed to initialize BlinkID SDK:", e), this.reportPinglet({
				schemaName: "ping.error",
				schemaVersion: "1.0.0",
				sessionNumber: 0,
				data: {
					errorType: "Crash",
					errorMessage: e instanceof Error ? e.message : String(e),
					stackTrace: e instanceof Error ? e.stack : void 0
				}
			}), this.sendPinglets(), e;
		}
	}
	createScanningSession(e, t) {
		if (!F(q, this)) throw Error("Wasm module not loaded");
		try {
			var n;
			let r = F(q, this).createScanningSession(e ?? {}, F(Z, this));
			return P(Y, this, (n = F(Y, this), n++, n)), this.sendPinglets(), N($, this, Ft).call(this, r, t?.redactionSettingsResolver);
		} catch (e) {
			throw this.reportPinglet({
				schemaName: "ping.error",
				schemaVersion: "1.0.0",
				sessionNumber: F(Y, this),
				data: {
					errorType: "Crash",
					errorMessage: e instanceof Error ? e.message : String(e),
					stackTrace: e instanceof Error ? e.stack : void 0
				}
			}), this.sendPinglets(), e;
		}
	}
	getDefaultRedactionSettings(e) {
		if (!F(q, this)) throw Error("Wasm module not loaded");
		try {
			return F(q, this).getDefaultRedactionSettings(e);
		} catch (e) {
			throw console.warn("Failed to get default redaction settings:", e), this.reportPinglet({
				schemaName: "ping.error",
				schemaVersion: "1.0.0",
				sessionNumber: F(Y, this),
				data: {
					errorType: "NonFatal",
					errorMessage: e instanceof Error ? e.message : String(e)
				}
			}), this.sendPinglets(), Error("Failed to get default redaction settings", { cause: e });
		}
	}
	[S]() {}
	async terminate() {
		let e = 5e3;
		if (self.setTimeout(() => self.close, e), F(J, this)) try {
			F(J, this).isDeleted() || (console.debug("Deleting BlinkId session during terminate"), F(J, this).delete());
		} catch (e) {
			if (console.warn("Failed to delete BlinkId session during terminate:", e), !F(q, this)) return;
			this.reportPinglet({
				schemaName: "ping.error",
				schemaVersion: "1.0.0",
				sessionNumber: F(Y, this),
				data: {
					errorType: "NonFatal",
					errorMessage: e instanceof Error ? e.message : String(e),
					stackTrace: e instanceof Error ? e.stack : void 0
				}
			}), this.sendPinglets();
		} finally {
			P(J, this, void 0);
		}
		if (!F(q, this)) {
			F(Q, this)?.call(this), P(Q, this, void 0), console.warn("No Wasm module loaded during worker termination. Skipping cleanup."), self.close();
			return;
		}
		F(q, this).terminateSdk(), await new Promise((e) => setTimeout(e, 0)), this.sendPinglets();
		let t = Date.now();
		for (; F(q, this).arePingRequestsInProgress() && Date.now() - t < e;) await new Promise((e) => setTimeout(e, 100));
		P(q, this, void 0), F(Q, this)?.call(this), P(Q, this, void 0), console.debug("BlinkIdWorker terminated 🔴"), self.close();
	}
};
async function jt({ resourceUrl: n, wasmVariant: r, featureVariant: i, initialMemory: a, resourceDownloadTimeoutMs: s }, c) {
	if (F(q, this)) {
		console.log("Wasm already loaded");
		return;
	}
	let d = "BlinkIdModule", f = t(n, i, r), p = t(f, `${d}.js`), m = t(f, `${d}.wasm`), h = t(f, `${d}.data`), g = await te(p), ee = (await import(
		/* @vite-ignore */
		g
)).default;
	(a === void 0 || a === 0) && (a = re() ? 700 : 200);
	let _ = new WebAssembly.Memory({
		initial: ie(a),
		maximum: ie(2048),
		shared: be(r)
	}), v, y, b = () => {
		!v || !y || c?.updateWasm(v, y);
	}, ae = (e) => {
		v = e, b();
	}, oe = (e) => {
		y = e, b();
	}, x = (t) => ne({
		...t,
		buildType: i
	}, e), [se, ce] = await Promise.all([l({
		url: m,
		fileType: "wasm",
		variant: r,
		buildType: i,
		progressCallback: ae,
		timeoutMs: s,
		resourceDescription: "BlinkID Wasm resource"
	}, x), o({
		url: h,
		fileType: "data",
		variant: r,
		buildType: i,
		progressCallback: oe,
		timeoutMs: s,
		resourceDescription: "BlinkID data resource"
	}, x)]);
	if (v && y && c?.updateWasm(v, y, !0), P(q, this, await ee({
		locateFile: (e) => `${f}/${e}`,
		onAbort: (e) => {
			F(q, this) && (this.reportPinglet({
				schemaName: "ping.error",
				schemaVersion: "1.0.0",
				sessionNumber: F(Y, this),
				data: {
					errorType: "Crash",
					errorMessage: e instanceof Error ? e.message : String(e),
					stackTrace: e instanceof Error ? e.stack : void 0
				}
			}), this.sendPinglets());
		},
		printErr: (e) => {
			if (console.error(e), /\babort(ed)?\b/i.test(e)) {
				if (!F(q, this)) return;
				this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "Crash",
						errorMessage: String(e),
						stackTrace: void 0
					}
				}), this.sendPinglets();
			}
		},
		mainScriptUrlOrBlob: g,
		instantiateWasm: u(se),
		getPreloadedPackage() {
			return ce;
		},
		wasmMemory: _,
		noExitRuntime: !0
	})), !F(q, this)) throw Error("Failed to load Wasm module");
}
async function Mt(e, t, n, r) {
	let i = wt(e), a = t;
	if (i.checkForUpdates) try {
		a = $e(t, await N($, this, Pt).call(this, i.otaResourceProviderUrl, n));
	} catch (e) {
		if (i.strict) throw e;
		console.warn("BlinkID OTA provider resources were not loaded. Using hosted resources.", e);
	}
	r?.setSelectedOtaResources(a);
	let o = r ? (e, t) => {
		r.updateOta(e, t);
	} : void 0;
	return tt({
		resources: a,
		directory: qe,
		fallbackOnError: !i.strict,
		...o ? { progressCallback: o } : {},
		timeoutMs: n
	});
}
function Nt(e, n, r) {
	return Qe({
		resourcesLocation: wt(e).resourcesLocation ?? t(n, "ota-resources"),
		timeoutMs: r
	});
}
async function Pt(e, t) {
	return et({
		resourceProviderUrl: e,
		genericVersion: "25.0.4",
		timeoutMs: t
	});
}
function Ft(e, t) {
	P(J, this, e);
	let n = null, r = null;
	return O({
		getResult: async () => {
			try {
				if (!t || !n) return e.getResult();
				let r = await t(n, O((e) => Promise.resolve(this.getDefaultRedactionSettings({
					country: e.country,
					region: e.region,
					documentType: e.documentType,
					countryName: "",
					isoAlpha2CountryCode: "",
					isoAlpha3CountryCode: "",
					isoNumericCountryCode: ""
				}))));
				return r ? e.getResult(xt(Et, r)) : e.getResult();
			} catch (e) {
				throw F(q, this) ? (this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "NonFatal",
						errorMessage: e instanceof Error ? e.message : String(e),
						stackTrace: e instanceof Error ? e.stack : void 0
					}
				}), this.sendPinglets(), e) : e;
			}
		},
		process: (t) => {
			try {
				let i = e.process(t);
				if ("error" in i) F(q, this) && (this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "NonFatal",
						errorMessage: String(i.error),
						stackTrace: void 0
					}
				}), this.sendPinglets());
				else {
					let e = i.inputImageAnalysisResult;
					(e.processingStatus === "detection-failed" || e.processingStatus === "stability-test-failed") && (n = null, r = null), e.documentClassInfo?.documentType && (n = e.documentClassInfo), e.documentRotation !== "not-available" && (r = e.documentRotation), n && n.documentType?.rawValue !== e.documentClassInfo?.documentType?.rawValue && (e.documentClassInfo = n), r && r !== e.documentRotation && (e.documentRotation = r);
				}
				let a;
				try {
					a = Re({
						...i,
						arrayBuffer: t.data.buffer
					}, [t.data.buffer]);
				} catch (e) {
					let t = Dt("Failed to transfer frame from worker", e);
					throw F(q, this) ? (this.reportPinglet({
						schemaName: "ping.error",
						schemaVersion: "1.0.0",
						sessionNumber: F(Y, this),
						data: {
							errorType: "Crash",
							errorMessage: t.message,
							stackTrace: t.stack
						}
					}), this.sendPinglets(), t) : t;
				}
				return a;
			} catch (e) {
				throw e instanceof Error && e.name === St || !F(q, this) ? e : (this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "NonFatal",
						errorMessage: e instanceof Error ? e.message : String(e),
						stackTrace: e instanceof Error ? e.stack : void 0
					}
				}), this.sendPinglets(), e);
			}
		},
		getScanningStatus: () => {
			try {
				return e.getScanningStatus();
			} catch (e) {
				throw this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "NonFatal",
						errorMessage: e instanceof Error ? e.message : String(e),
						stackTrace: e instanceof Error ? e.stack : void 0
					}
				}), this.sendPinglets(), e;
			}
		},
		ping: (e) => {
			this.reportPinglet({
				...e,
				sessionNumber: e.sessionNumber ?? F(Y, this)
			});
		},
		sendPinglets: () => this.sendPinglets(),
		getSettings: () => e.getSettings(),
		getResolvedSessionSettings: () => e.getResolvedSessionSettings(),
		getSessionId: () => e.getSessionId(),
		getSessionNumber: () => e.getSessionNumber(),
		resolveCurrentStep: () => {
			try {
				console.debug("BlinkIdWorker: resolveCurrentStep"), e.resolveCurrentStep();
			} catch (e) {
				throw this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "NonFatal",
						errorMessage: e instanceof Error ? e.message : String(e),
						stackTrace: e instanceof Error ? e.stack : void 0
					}
				}), this.sendPinglets(), e;
			}
		},
		reset: () => {
			try {
				e.reset(), n = null, r = null;
			} catch (e) {
				throw F(q, this) ? (this.reportPinglet({
					schemaName: "ping.error",
					schemaVersion: "1.0.0",
					sessionNumber: F(Y, this),
					data: {
						errorType: "NonFatal",
						errorMessage: e instanceof Error ? e.message : String(e),
						stackTrace: e instanceof Error ? e.stack : void 0
					}
				}), this.sendPinglets(), e) : e;
			}
		},
		delete: () => {
			e.isDeleted() || e.delete(), F(J, this) === e && P(J, this, void 0);
		},
		deleteLater: () => {
			e.isDeleted() || e.deleteLater(), F(J, this) === e && P(J, this, void 0);
		},
		isDeleted: () => e.isDeleted(),
		isAliasOf: (t) => e.isAliasOf(t),
		showDemoOverlay: () => F(Ot, this),
		showProductionOverlay: () => F(kt, this)
	});
}
Oe(new At());
//#endregion
