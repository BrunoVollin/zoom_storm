module.exports = [
"[project]/.next-internal/server/app/api/auth/[...path]/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/bff-proxy.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "proxyToBff",
    ()=>proxyToBff
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const BFF_BASE_URL = process.env.BFF_BASE_URL ?? "http://localhost:8088";
const HOP_BY_HOP_REQUEST_HEADERS = new Set([
    "host",
    "connection",
    "content-length"
]);
async function proxyToBff(request, segments, prefix) {
    const targetUrl = new URL(`${prefix}/${segments.join("/")}`, BFF_BASE_URL);
    targetUrl.search = request.nextUrl.search;
    const headers = new Headers();
    request.headers.forEach((value, key)=>{
        if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });
    const hasBody = ![
        "GET",
        "HEAD"
    ].includes(request.method);
    const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
        redirect: "manual"
    });
    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key)=>{
        if (key.toLowerCase() !== "content-encoding") {
            responseHeaders.append(key, value);
        }
    });
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: responseHeaders
    });
}
}),
"[project]/src/lib/create-proxy-route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createProxyRoute",
    ()=>createProxyRoute
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$bff$2d$proxy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/bff-proxy.ts [app-route] (ecmascript)");
;
function createProxyRoute(prefix) {
    const handle = async (request, { params })=>{
        const { path } = await params;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$bff$2d$proxy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["proxyToBff"])(request, path, prefix);
    };
    return {
        GET: handle,
        POST: handle,
        PATCH: handle,
        DELETE: handle,
        PUT: handle
    };
}
}),
"[project]/src/app/api/auth/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$create$2d$proxy$2d$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/create-proxy-route.ts [app-route] (ecmascript)");
;
const { GET, POST, PATCH, DELETE, PUT } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$create$2d$proxy$2d$route$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createProxyRoute"])("/auth");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d9983018._.js.map