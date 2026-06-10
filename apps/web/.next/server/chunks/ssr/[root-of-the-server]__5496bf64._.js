module.exports = [
  "[project]/.next-internal/server/app/login/page/actions.js [app-rsc] (server actions loader, ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s([]);
  },
  "[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)",
  (__turbopack_context__) => {
    __turbopack_context__.n(
      __turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"),
    );
  },
  "[project]/src/app/error.tsx [app-rsc] (ecmascript, Next.js Server Component)",
  (__turbopack_context__) => {
    __turbopack_context__.n(
      __turbopack_context__.i("[project]/src/app/error.tsx [app-rsc] (ecmascript)"),
    );
  },
  "[project]/src/app/loading.tsx [app-rsc] (ecmascript, Next.js Server Component)",
  (__turbopack_context__) => {
    __turbopack_context__.n(
      __turbopack_context__.i("[project]/src/app/loading.tsx [app-rsc] (ecmascript)"),
    );
  },
  "[project]/src/app/not-found.tsx [app-rsc] (ecmascript, Next.js Server Component)",
  (__turbopack_context__) => {
    __turbopack_context__.n(
      __turbopack_context__.i("[project]/src/app/not-found.tsx [app-rsc] (ecmascript)"),
    );
  },
  "[externals]/stream [external] (stream, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("stream", () => require("stream"));

    module.exports = mod;
  },
  "[externals]/http [external] (http, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("http", () => require("http"));

    module.exports = mod;
  },
  "[externals]/https [external] (https, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("https", () => require("https"));

    module.exports = mod;
  },
  "[externals]/url [external] (url, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("url", () => require("url"));

    module.exports = mod;
  },
  "[externals]/fs [external] (fs, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("fs", () => require("fs"));

    module.exports = mod;
  },
  "[externals]/crypto [external] (crypto, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("crypto", () => require("crypto"));

    module.exports = mod;
  },
  "[externals]/net [external] (net, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("net", () => require("net"));

    module.exports = mod;
  },
  "[externals]/tls [external] (tls, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("tls", () => require("tls"));

    module.exports = mod;
  },
  "[externals]/assert [external] (assert, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("assert", () => require("assert"));

    module.exports = mod;
  },
  "[externals]/tty [external] (tty, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("tty", () => require("tty"));

    module.exports = mod;
  },
  "[externals]/os [external] (os, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("os", () => require("os"));

    module.exports = mod;
  },
  "[externals]/events [external] (events, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("events", () => require("events"));

    module.exports = mod;
  },
  "[externals]/http2 [external] (http2, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("http2", () => require("http2"));

    module.exports = mod;
  },
  "[externals]/zlib [external] (zlib, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("zlib", () => require("zlib"));

    module.exports = mod;
  },
  "[project]/src/lib/http.ts [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["http", () => http]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-rsc] (ecmascript)");
    const isServer = "undefined" === "undefined";
    const SITE_URL =
      ("TURBOPACK compile-time value", "http://localhost:3100") ?? "http://localhost:3100";
    const http =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
        "default"
      ].create({
        baseURL: ("TURBOPACK compile-time truthy", 1) ? `${SITE_URL}/api` : "TURBOPACK unreachable",
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    http.interceptors.request.use(async (config) => {
      if (("TURBOPACK compile-time truthy", 1)) {
        const { cookies } = await __turbopack_context__.A(
          "[project]/node_modules/next/headers.js [app-rsc] (ecmascript, async loader)",
        );
        const cookieStore = await cookies();
        const cookieHeader = cookieStore.toString();
        if (cookieHeader) {
          config.headers.set("Cookie", cookieHeader);
        }
      }
      return config;
    });
    http.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError = {
          status: error.response?.status ?? 0,
          message:
            error.response?.data?.message ?? error.message ?? "Erro inesperado de comunicação",
        };
        return Promise.reject(apiError);
      },
    );
  },
  "[project]/src/services/auth-service.ts [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["authService", () => authService]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$http$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/lib/http.ts [app-rsc] (ecmascript)");
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/constants/routes.ts [app-rsc] (ecmascript)");
    const authService = {
      loginUrl: `/api${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BFF_ROUTES"].login}`,
      logoutUrl(global = false) {
        return `/api${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BFF_ROUTES"].logout}${global ? "?global=true" : ""}`;
      },
      async getCurrentUser() {
        try {
          const { data } =
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$http$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
              "http"
            ].get(
              __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                "BFF_ROUTES"
              ].me,
            );
          return data;
        } catch {
          return null;
        }
      },
      async logout(global = false) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$http$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
          "http"
        ].post(
          `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$routes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BFF_ROUTES"].logout}${global ? "?global=true" : ""}`,
        );
      },
    };
  },
  "[project]/src/app/login/page.tsx [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["default", () => LoginPage]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/services/auth-service.ts [app-rsc] (ecmascript)");
    function LoginPage() {
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
        "redirect"
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
          "authService"
        ].loginUrl,
      );
    }
  },
  "[project]/src/app/login/page.tsx [app-rsc] (ecmascript, Next.js Server Component)",
  (__turbopack_context__) => {
    __turbopack_context__.n(
      __turbopack_context__.i("[project]/src/app/login/page.tsx [app-rsc] (ecmascript)"),
    );
  },
  "[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () =>
      require("next/dist/shared/lib/no-fallback-error.external.js"),
    );

    module.exports = mod;
  },
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5496bf64._.js.map
