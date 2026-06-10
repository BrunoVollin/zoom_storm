module.exports = [
  "[project]/.next-internal/server/app/products/[id]/page/actions.js [app-rsc] (server actions loader, ecmascript)",
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
  "[project]/src/components/ui/badge.tsx [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["Badge", () => Badge, "badgeVariants", () => badgeVariants]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/class-variance-authority/dist/index.mjs [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
    const badgeVariants = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
      "cva"
    ])("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
      variants: {
        variant: {
          default: "border-transparent bg-primary text-primary-foreground",
          outline: "border-border text-foreground",
          muted: "border-transparent bg-muted text-muted-foreground",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    });
    function Badge({ className, variant, ...props }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
        "jsxDEV"
      ])(
        "div",
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "cn"
          ])(
            badgeVariants({
              variant,
            }),
            className,
          ),
          ...props,
        },
        void 0,
        false,
        {
          fileName: "[project]/src/components/ui/badge.tsx",
          lineNumber: 27,
          columnNumber: 10,
        },
        this,
      );
    }
  },
  "[project]/src/utils/format-price.ts [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    /** Backend prices are integers in cents (e.g. 4999 === R$ 49,99). */ __turbopack_context__.s([
      "formatPrice",
      () => formatPrice,
    ]);
    function formatPrice(cents) {
      return (cents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
  },
  "[project]/src/components/shared/price-tag.tsx [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["PriceTag", () => PriceTag]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2d$price$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/utils/format-price.ts [app-rsc] (ecmascript)");
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/lib/utils.ts [app-rsc] (ecmascript)");
    function PriceTag({ cents, className }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
        "jsxDEV"
      ])(
        "span",
        {
          className: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "cn"
          ])("font-semibold tabular-nums", className),
          children: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2d$price$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "formatPrice"
          ])(cents),
        },
        void 0,
        false,
        {
          fileName: "[project]/src/components/shared/price-tag.tsx",
          lineNumber: 10,
          columnNumber: 10,
        },
        this,
      );
    }
  },
  "[project]/src/components/features/cart/add-to-cart-button.tsx [app-rsc] (client reference proxy) <module evaluation>",
  (__turbopack_context__) => {
    "use strict";

    // This file is generated by next-core EcmascriptClientReferenceModule.
    __turbopack_context__.s(["AddToCartButton", () => AddToCartButton]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)",
      );
    const AddToCartButton = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
      "registerClientReference"
    ])(
      function () {
        throw new Error(
          "Attempted to call AddToCartButton() from the server but AddToCartButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
        );
      },
      "[project]/src/components/features/cart/add-to-cart-button.tsx <module evaluation>",
      "AddToCartButton",
    );
  },
  "[project]/src/components/features/cart/add-to-cart-button.tsx [app-rsc] (client reference proxy)",
  (__turbopack_context__) => {
    "use strict";

    // This file is generated by next-core EcmascriptClientReferenceModule.
    __turbopack_context__.s(["AddToCartButton", () => AddToCartButton]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)",
      );
    const AddToCartButton = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
      "registerClientReference"
    ])(
      function () {
        throw new Error(
          "Attempted to call AddToCartButton() from the server but AddToCartButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
        );
      },
      "[project]/src/components/features/cart/add-to-cart-button.tsx",
      "AddToCartButton",
    );
  },
  "[project]/src/components/features/cart/add-to-cart-button.tsx [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$cart$2f$add$2d$to$2d$cart$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ =
      __turbopack_context__.i(
        "[project]/src/components/features/cart/add-to-cart-button.tsx [app-rsc] (client reference proxy) <module evaluation>",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$cart$2f$add$2d$to$2d$cart$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ =
      __turbopack_context__.i(
        "[project]/src/components/features/cart/add-to-cart-button.tsx [app-rsc] (client reference proxy)",
      );
    __turbopack_context__.n(
      __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$cart$2f$add$2d$to$2d$cart$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__,
    );
  },
  "[project]/src/components/features/products/product-detail.tsx [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["ProductDetail", () => ProductDetail]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gamepad$2d$2$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Gamepad2$3e$__ =
      __turbopack_context__.i(
        "[project]/node_modules/lucide-react/dist/esm/icons/gamepad-2.js [app-rsc] (ecmascript) <export default as Gamepad2>",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/components/ui/badge.tsx [app-rsc] (ecmascript)");
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$shared$2f$price$2d$tag$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/src/components/shared/price-tag.tsx [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$cart$2f$add$2d$to$2d$cart$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/src/components/features/cart/add-to-cart-button.tsx [app-rsc] (ecmascript)",
      );
    function ProductDetail({ product }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
        "jsxDEV"
      ])(
        "div",
        {
          className: "grid gap-8 md:grid-cols-2",
          children: [
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
              "jsxDEV"
            ])(
              "div",
              {
                className:
                  "flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground",
                children: /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                  "jsxDEV"
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gamepad$2d$2$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Gamepad2$3e$__[
                    "Gamepad2"
                  ],
                  {
                    className: "size-24",
                  },
                  void 0,
                  false,
                  {
                    fileName: "[project]/src/components/features/products/product-detail.tsx",
                    lineNumber: 13,
                    columnNumber: 9,
                  },
                  this,
                ),
              },
              void 0,
              false,
              {
                fileName: "[project]/src/components/features/products/product-detail.tsx",
                lineNumber: 12,
                columnNumber: 7,
              },
              this,
            ),
            /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
              "jsxDEV"
            ])(
              "div",
              {
                className: "flex flex-col gap-4",
                children: [
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "div",
                    {
                      children: [
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                            "Badge"
                          ],
                          {
                            variant: "muted",
                            className: "mb-2 w-fit",
                            children: product.category,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              "[project]/src/components/features/products/product-detail.tsx",
                            lineNumber: 17,
                            columnNumber: 11,
                          },
                          this,
                        ),
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                          "jsxDEV"
                        ])(
                          "h1",
                          {
                            className: "text-2xl font-semibold",
                            children: product.name,
                          },
                          void 0,
                          false,
                          {
                            fileName:
                              "[project]/src/components/features/products/product-detail.tsx",
                            lineNumber: 20,
                            columnNumber: 11,
                          },
                          this,
                        ),
                      ],
                    },
                    void 0,
                    true,
                    {
                      fileName: "[project]/src/components/features/products/product-detail.tsx",
                      lineNumber: 16,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "p",
                    {
                      className: "text-muted-foreground",
                      children: product.description,
                    },
                    void 0,
                    false,
                    {
                      fileName: "[project]/src/components/features/products/product-detail.tsx",
                      lineNumber: 22,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$shared$2f$price$2d$tag$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                      "PriceTag"
                    ],
                    {
                      cents: product.price,
                      className: "text-3xl",
                    },
                    void 0,
                    false,
                    {
                      fileName: "[project]/src/components/features/products/product-detail.tsx",
                      lineNumber: 23,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    "p",
                    {
                      className: "text-sm text-muted-foreground",
                      children:
                        product.stock > 0
                          ? `${product.stock} unidades em estoque`
                          : "Sem estoque no momento",
                    },
                    void 0,
                    false,
                    {
                      fileName: "[project]/src/components/features/products/product-detail.tsx",
                      lineNumber: 24,
                      columnNumber: 9,
                    },
                    this,
                  ),
                  /*#__PURE__*/ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                    "jsxDEV"
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$cart$2f$add$2d$to$2d$cart$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
                      "AddToCartButton"
                    ],
                    {
                      productId: product.id,
                      disabled: product.stock <= 0,
                      className: "w-full md:w-auto",
                    },
                    void 0,
                    false,
                    {
                      fileName: "[project]/src/components/features/products/product-detail.tsx",
                      lineNumber: 27,
                      columnNumber: 9,
                    },
                    this,
                  ),
                ],
              },
              void 0,
              true,
              {
                fileName: "[project]/src/components/features/products/product-detail.tsx",
                lineNumber: 15,
                columnNumber: 7,
              },
              this,
            ),
          ],
        },
        void 0,
        true,
        {
          fileName: "[project]/src/components/features/products/product-detail.tsx",
          lineNumber: 11,
          columnNumber: 5,
        },
        this,
      );
    }
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
  "[project]/src/services/product-service.ts [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["productService", () => productService]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$http$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/lib/http.ts [app-rsc] (ecmascript)");
    const productService = {
      async list() {
        const { data } =
          await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$http$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "http"
          ].get("/products");
        return data;
      },
      async getById(id) {
        const { data } =
          await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$http$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "http"
          ].get(`/products/${id}`);
        return data;
      },
    };
  },
  "[project]/src/app/products/[id]/page.tsx [app-rsc] (ecmascript)",
  (__turbopack_context__) => {
    "use strict";

    __turbopack_context__.s(["default", () => ProductPage]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$products$2f$product$2d$detail$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/src/components/features/products/product-detail.tsx [app-rsc] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$product$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/src/services/product-service.ts [app-rsc] (ecmascript)");
    async function ProductPage({ params }) {
      const { id } = await params;
      try {
        const product =
          await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$product$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "productService"
          ].getById(id);
        return /*#__PURE__*/ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
          "jsxDEV"
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$features$2f$products$2f$product$2d$detail$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "ProductDetail"
          ],
          {
            product: product,
          },
          void 0,
          false,
          {
            fileName: "[project]/src/app/products/[id]/page.tsx",
            lineNumber: 16,
            columnNumber: 12,
          },
          this,
        );
      } catch (error) {
        if (error.status === 404) {
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__[
            "notFound"
          ])();
        }
        throw error;
      }
    }
  },
  "[project]/src/app/products/[id]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)",
  (__turbopack_context__) => {
    __turbopack_context__.n(
      __turbopack_context__.i("[project]/src/app/products/[id]/page.tsx [app-rsc] (ecmascript)"),
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

//# sourceMappingURL=%5Broot-of-the-server%5D__9b361bfd._.js.map
