"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/[...nextauth]/route";
exports.ids = ["app/api/auth/[...nextauth]/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Calusa%5Capps%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Calusa%5Capps%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Calusa%5Capps%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Calusa%5Capps%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_alusa_apps_web_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/[...nextauth]/route.ts */ \"(rsc)/./app/api/auth/[...nextauth]/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/[...nextauth]/route\",\n        pathname: \"/api/auth/[...nextauth]\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/[...nextauth]/route\"\n    },\n    resolvedPagePath: \"C:\\\\alusa\\\\apps\\\\web\\\\app\\\\api\\\\auth\\\\[...nextauth]\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_alusa_apps_web_app_api_auth_nextauth_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/[...nextauth]/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL25leHRAMTQuMi41X0BwbGF5d3JpZ2h0K3Rlc3RAMS41NS4wX3JlYWN0LWRvbUAxOC4zLjFfcmVhY3RAMTguMy4xX19yZWFjdEAxOC4zLjEvbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1hcHAtbG9hZGVyLmpzP25hbWU9YXBwJTJGYXBpJTJGYXV0aCUyRiU1Qi4uLm5leHRhdXRoJTVEJTJGcm91dGUmcGFnZT0lMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhdXRoJTJGJTVCLi4ubmV4dGF1dGglNUQlMkZyb3V0ZS50cyZhcHBEaXI9QyUzQSU1Q2FsdXNhJTVDYXBwcyU1Q3dlYiU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q2FsdXNhJTVDYXBwcyU1Q3dlYiZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDYTtBQUMxRjtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL0BhbHVzYS93ZWIvPzgyOGMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcYWx1c2FcXFxcYXBwc1xcXFx3ZWJcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9bLi4ubmV4dGF1dGhdL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcYWx1c2FcXFxcYXBwc1xcXFx3ZWJcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXFsuLi5uZXh0YXV0aF1cXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Calusa%5Capps%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Calusa%5Capps%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/auth/[...nextauth]/route.ts":
/*!*********************************************!*\
  !*** ./app/api/auth/[...nextauth]/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* reexport safe */ _auth_config__WEBPACK_IMPORTED_MODULE_0__.GET),\n/* harmony export */   POST: () => (/* reexport safe */ _auth_config__WEBPACK_IMPORTED_MODULE_0__.POST)\n/* harmony export */ });\n/* harmony import */ var _auth_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../auth.config */ \"(rsc)/./auth.config.ts\");\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F1dGgvWy4uLm5leHRhdXRoXS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBb0QiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AYWx1c2Evd2ViLy4vYXBwL2FwaS9hdXRoL1suLi5uZXh0YXV0aF0vcm91dGUudHM/YzhhNCJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBHRVQsIFBPU1QgfSBmcm9tICcuLi8uLi8uLi8uLi9hdXRoLmNvbmZpZyc7XHJcbiJdLCJuYW1lcyI6WyJHRVQiLCJQT1NUIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/[...nextauth]/route.ts\n");

/***/ }),

/***/ "(rsc)/./auth.config.ts":
/*!************************!*\
  !*** ./auth.config.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler),\n/* harmony export */   authConfig: () => (/* binding */ authConfig),\n/* harmony export */   signIn: () => (/* reexport safe */ next_auth_react__WEBPACK_IMPORTED_MODULE_4__.signIn),\n/* harmony export */   signOut: () => (/* reexport safe */ next_auth_react__WEBPACK_IMPORTED_MODULE_4__.signOut)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/../../node_modules/.pnpm/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma/node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/../../node_modules/.pnpm/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma/node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/prisma */ \"(rsc)/./lib/prisma.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/../../node_modules/.pnpm/bcryptjs@3.0.2/node_modules/bcryptjs/index.js\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! next-auth/react */ \"(rsc)/../../node_modules/.pnpm/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma/node_modules/next-auth/react/index.js\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_4__);\n\n\n // caminho relativo dentro de apps/web\n\n// Configuração NextAuth (v4). Evitar padrões de v5 (handlers, auth) pois pacote instalado é 4.x.\nconst authConfig = {\n    secret: process.env.NEXTAUTH_SECRET,\n    session: {\n        strategy: \"jwt\"\n    },\n    pages: {\n        signIn: \"/login\"\n    },\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Senha\",\n                    type: \"password\"\n                }\n            },\n            async authorize (creds) {\n                if (!creds?.email || !creds?.password) return null;\n                // Tenta modelo User (schema atual). Se não existir, cai no fallback.\n                const tryUser = async ()=>{\n                    try {\n                        const u = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                            where: {\n                                email: creds.email\n                            },\n                            include: {\n                                role: true\n                            }\n                        });\n                        if (u?.senhaHash) {\n                            const ok = await bcryptjs__WEBPACK_IMPORTED_MODULE_3__[\"default\"].compare(creds.password, u.senhaHash);\n                            if (ok) {\n                                console.log(\"[auth] login via User ok\", u.email);\n                                return {\n                                    id: u.id,\n                                    email: u.email,\n                                    name: u.email.split(\"@\")[0],\n                                    role: u.role?.name || \"USER\"\n                                };\n                            }\n                            console.log(\"[auth] senha inv\\xe1lida User\", u.email);\n                        }\n                    } catch (e) {\n                        console.warn(\"[auth] tryUser erro\", e.message);\n                    }\n                    return null;\n                };\n                const tryUsuario = async ()=>{\n                    try {\n                        const anyPrisma = _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma; // eslint-disable-line @typescript-eslint/no-explicit-any\n                        if (!anyPrisma.usuario) return null;\n                        const uu = await anyPrisma.usuario.findUnique({\n                            where: {\n                                email: creds.email\n                            }\n                        });\n                        if (uu?.senhaHash) {\n                            const ok = await bcryptjs__WEBPACK_IMPORTED_MODULE_3__[\"default\"].compare(creds.password, uu.senhaHash);\n                            if (ok) {\n                                console.log(\"[auth] login via Usuario ok\", uu.email);\n                                return {\n                                    id: uu.id,\n                                    email: uu.email,\n                                    name: uu.nome ?? uu.email,\n                                    role: \"USER\"\n                                }; // eslint-disable-line @typescript-eslint/no-explicit-any\n                            }\n                            console.log(\"[auth] senha inv\\xe1lida Usuario\", uu.email);\n                        }\n                    } catch (e) {\n                        console.warn(\"[auth] tryUsuario erro\", e.message);\n                    }\n                    return null;\n                };\n                const r = await tryUser() || await tryUsuario();\n                if (!r) console.log(\"[auth] credenciais inv\\xe1lidas\", creds.email);\n                return r;\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                const u = user;\n                token.id = u.id;\n                token.role = u.role || \"USER\";\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.id; // eslint-disable-line @typescript-eslint/no-explicit-any\n                session.user.role = token.role || \"USER\"; // eslint-disable-line @typescript-eslint/no-explicit-any\n            }\n            return session;\n        }\n    }\n};\n// Em NextAuth v4 no App Router, chamamos NextAuth(config) e reexportamos como GET/POST.\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(authConfig);\n\n// Reexport utilidades client-side (não usadas server) para conveniência de imports.\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Z0NaLE1BQU1MLEtBQUs7Z0JBQy9ELE9BQU80QjtZQUNUO1FBQ0Y7S0FDRDtJQUNEQyxXQUFXO1FBQ1gsTUFBTUMsS0FBSSxFQUFFQyxLQUFLLEVBQUV2QixJQUFJLEVBQU87WUFDMUIsSUFBSUEsTUFBTTtnQkFDUixNQUFNRCxJQUFJQztnQkFDVnVCLE1BQU1iLEVBQUUsR0FBR1gsRUFBRVcsRUFBRTtnQkFDZmEsTUFBTW5CLElBQUksR0FBR0wsRUFBRUssSUFBSSxJQUFJO1lBQ3pCO1lBQ0EsT0FBT21CO1FBQ1Q7UUFDRixNQUFNdEMsU0FBUSxFQUFFQSxPQUFPLEVBQUVzQyxLQUFLLEVBQU87WUFDakMsSUFBSXRDLFFBQVFlLElBQUksRUFBRTtnQkFDZmYsUUFBUWUsSUFBSSxDQUFTVSxFQUFFLEdBQUdhLE1BQU1iLEVBQUUsRUFBRSx5REFBeUQ7Z0JBQzdGekIsUUFBUWUsSUFBSSxDQUFTSSxJQUFJLEdBQUcsTUFBZUEsSUFBSSxJQUFJLFFBQVEseURBQXlEO1lBQ3ZIO1lBQ0EsT0FBT25CO1FBQ1Q7SUFDRjtBQUNGLEVBQUU7QUFFRix3RkFBd0Y7QUFDeEYsTUFBTXVDLFVBQVVoRCxnREFBUUEsQ0FBQ0k7QUFDa0I7QUFDM0Msb0ZBQW9GO0FBQ2xDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGFsdXNhL3dlYi8uL2F1dGguY29uZmlnLnRzPzQzMDgiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE5leHRBdXRoLCB7IHR5cGUgQXV0aE9wdGlvbnMgfSBmcm9tIFwibmV4dC1hdXRoXCI7XHJcbmltcG9ydCBDcmVkZW50aWFscyBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiO1xyXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiLi9saWIvcHJpc21hXCI7IC8vIGNhbWluaG8gcmVsYXRpdm8gZGVudHJvIGRlIGFwcHMvd2ViXHJcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XHJcblxyXG4vLyBDb25maWd1cmHDp8OjbyBOZXh0QXV0aCAodjQpLiBFdml0YXIgcGFkcsO1ZXMgZGUgdjUgKGhhbmRsZXJzLCBhdXRoKSBwb2lzIHBhY290ZSBpbnN0YWxhZG8gw6kgNC54LlxyXG5leHBvcnQgY29uc3QgYXV0aENvbmZpZzogQXV0aE9wdGlvbnMgPSB7XHJcbiAgc2VjcmV0OiBwcm9jZXNzLmVudi5ORVhUQVVUSF9TRUNSRVQsXHJcbiAgc2Vzc2lvbjogeyBzdHJhdGVneTogXCJqd3RcIiB9LFxyXG4gIHBhZ2VzOiB7IHNpZ25JbjogXCIvbG9naW5cIiB9LFxyXG4gIHByb3ZpZGVyczogW1xyXG4gICAgQ3JlZGVudGlhbHMoe1xyXG4gICAgICBuYW1lOiBcImNyZWRlbnRpYWxzXCIsXHJcbiAgICAgIGNyZWRlbnRpYWxzOiB7XHJcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6IFwiRW1haWxcIiwgdHlwZTogXCJlbWFpbFwiIH0sXHJcbiAgICAgICAgcGFzc3dvcmQ6IHsgbGFiZWw6IFwiU2VuaGFcIiwgdHlwZTogXCJwYXNzd29yZFwiIH1cclxuICAgICAgfSxcclxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRzKSB7XHJcbiAgICAgICAgaWYgKCFjcmVkcz8uZW1haWwgfHwgIWNyZWRzPy5wYXNzd29yZCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgLy8gVGVudGEgbW9kZWxvIFVzZXIgKHNjaGVtYSBhdHVhbCkuIFNlIG7Do28gZXhpc3RpciwgY2FpIG5vIGZhbGxiYWNrLlxyXG4gICAgICAgIGNvbnN0IHRyeVVzZXIgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB1ID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7IHdoZXJlOiB7IGVtYWlsOiBjcmVkcy5lbWFpbCB9LCBpbmNsdWRlOiB7IHJvbGU6IHRydWUgfSB9KTtcclxuICAgICAgICAgICAgaWYgKHU/LnNlbmhhSGFzaCkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IG9rID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUoY3JlZHMucGFzc3dvcmQsIHUuc2VuaGFIYXNoKTtcclxuICAgICAgICAgICAgICBpZiAob2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbYXV0aF0gbG9naW4gdmlhIFVzZXIgb2snLCB1LmVtYWlsKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IGlkOiB1LmlkLCBlbWFpbDogdS5lbWFpbCwgbmFtZTogdS5lbWFpbC5zcGxpdChcIkBcIilbMF0sIHJvbGU6IHUucm9sZT8ubmFtZSB8fCBcIlVTRVJcIiB9O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW2F1dGhdIHNlbmhhIGludsOhbGlkYSBVc2VyJywgdS5lbWFpbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbYXV0aF0gdHJ5VXNlciBlcnJvJywgKGUgYXMgRXJyb3IpLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgdHJ5VXN1YXJpbyA9IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFueVByaXNtYSA9IHByaXNtYSBhcyBhbnk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICAgICAgICBpZiAoIWFueVByaXNtYS51c3VhcmlvKSByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgY29uc3QgdXUgPSBhd2FpdCBhbnlQcmlzbWEudXN1YXJpby5maW5kVW5pcXVlKHsgd2hlcmU6IHsgZW1haWw6IGNyZWRzLmVtYWlsIH0gfSk7XHJcbiAgICAgICAgICAgIGlmICh1dT8uc2VuaGFIYXNoKSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgb2sgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShjcmVkcy5wYXNzd29yZCwgdXUuc2VuaGFIYXNoKTtcclxuICAgICAgICAgICAgICBpZiAob2spIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbYXV0aF0gbG9naW4gdmlhIFVzdWFyaW8gb2snLCB1dS5lbWFpbCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyBpZDogdXUuaWQsIGVtYWlsOiB1dS5lbWFpbCwgbmFtZTogKHV1IGFzIGFueSkubm9tZSA/PyB1dS5lbWFpbCwgcm9sZTogXCJVU0VSXCIgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbYXV0aF0gc2VuaGEgaW52w6FsaWRhIFVzdWFyaW8nLCB1dS5lbWFpbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbYXV0aF0gdHJ5VXN1YXJpbyBlcnJvJywgKGUgYXMgRXJyb3IpLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgciA9IChhd2FpdCB0cnlVc2VyKCkpIHx8IChhd2FpdCB0cnlVc3VhcmlvKCkpO1xyXG4gICAgICAgIGlmICghcikgY29uc29sZS5sb2coJ1thdXRoXSBjcmVkZW5jaWFpcyBpbnbDoWxpZGFzJywgY3JlZHMuZW1haWwpO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0sXHJcbiAgY2FsbGJhY2tzOiB7XHJcbiAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIgfTogYW55KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICBpZiAodXNlcikge1xyXG4gICAgICAgIGNvbnN0IHUgPSB1c2VyIGFzIHsgaWQ6IHN0cmluZzsgcm9sZT86IHN0cmluZyB9O1xyXG4gICAgICAgIHRva2VuLmlkID0gdS5pZDtcclxuICAgICAgICB0b2tlbi5yb2xlID0gdS5yb2xlIHx8IFwiVVNFUlwiO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0b2tlbjtcclxuICAgIH0sXHJcbiAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH06IGFueSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgICAgaWYgKHNlc3Npb24udXNlcikge1xyXG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS5pZCA9IHRva2VuLmlkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkucm9sZSA9ICh0b2tlbiBhcyBhbnkpLnJvbGUgfHwgXCJVU0VSXCI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzZXNzaW9uO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8vIEVtIE5leHRBdXRoIHY0IG5vIEFwcCBSb3V0ZXIsIGNoYW1hbW9zIE5leHRBdXRoKGNvbmZpZykgZSByZWV4cG9ydGFtb3MgY29tbyBHRVQvUE9TVC5cclxuY29uc3QgaGFuZGxlciA9IE5leHRBdXRoKGF1dGhDb25maWcpO1xyXG5leHBvcnQgeyBoYW5kbGVyIGFzIEdFVCwgaGFuZGxlciBhcyBQT1NUIH07XHJcbi8vIFJlZXhwb3J0IHV0aWxpZGFkZXMgY2xpZW50LXNpZGUgKG7Do28gdXNhZGFzIHNlcnZlcikgcGFyYSBjb252ZW5pw6puY2lhIGRlIGltcG9ydHMuXHJcbmV4cG9ydCB7IHNpZ25Jbiwgc2lnbk91dCB9IGZyb20gXCJuZXh0LWF1dGgvcmVhY3RcIjtcclxuIl0sIm5hbWVzIjpbIk5leHRBdXRoIiwiQ3JlZGVudGlhbHMiLCJwcmlzbWEiLCJiY3J5cHQiLCJhdXRoQ29uZmlnIiwic2VjcmV0IiwicHJvY2VzcyIsImVudiIsIk5FWFRBVVRIX1NFQ1JFVCIsInNlc3Npb24iLCJzdHJhdGVneSIsInBhZ2VzIiwic2lnbkluIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsImNyZWRzIiwidHJ5VXNlciIsInUiLCJ1c2VyIiwiZmluZFVuaXF1ZSIsIndoZXJlIiwiaW5jbHVkZSIsInJvbGUiLCJzZW5oYUhhc2giLCJvayIsImNvbXBhcmUiLCJjb25zb2xlIiwibG9nIiwiaWQiLCJzcGxpdCIsImUiLCJ3YXJuIiwibWVzc2FnZSIsInRyeVVzdWFyaW8iLCJhbnlQcmlzbWEiLCJ1c3VhcmlvIiwidXUiLCJub21lIiwiciIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwiaGFuZGxlciIsIkdFVCIsIlBPU1QiLCJzaWduT3V0Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./auth.config.ts\n");

/***/ }),

/***/ "(rsc)/./lib/prisma.ts":
/*!***********************!*\
  !*** ./lib/prisma.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\n// Evita múltiplas instâncias em dev (hot reload)\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma || new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvcHJpc21hLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUE4QztBQUU5QyxpREFBaUQ7QUFDakQsTUFBTUMsa0JBQWtCQztBQUVqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFBSSxJQUFJSCx3REFBWUEsR0FBRztBQUVuRSxJQUFJSSxJQUF5QixFQUFjSCxnQkFBZ0JFLE1BQU0sR0FBR0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AYWx1c2Evd2ViLy4vbGliL3ByaXNtYS50cz85ODIyIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gJ0BwcmlzbWEvY2xpZW50JztcclxuXHJcbi8vIEV2aXRhIG3Dumx0aXBsYXMgaW5zdMOibmNpYXMgZW0gZGV2IChob3QgcmVsb2FkKVxyXG5jb25zdCBnbG9iYWxGb3JQcmlzbWEgPSBnbG9iYWxUaGlzIGFzIHVua25vd24gYXMgeyBwcmlzbWE/OiBQcmlzbWFDbGllbnQgfTtcclxuXHJcbmV4cG9ydCBjb25zdCBwcmlzbWEgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hIHx8IG5ldyBQcmlzbWFDbGllbnQoKTtcclxuXHJcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID0gcHJpc21hO1xyXG4iXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsVGhpcyIsInByaXNtYSIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1","vendor-chunks/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma","vendor-chunks/@babel+runtime@7.28.3","vendor-chunks/bcryptjs@3.0.2","vendor-chunks/jose@4.15.9","vendor-chunks/openid-client@5.7.1","vendor-chunks/oauth@0.9.15","vendor-chunks/object-hash@2.2.0","vendor-chunks/preact@10.27.1","vendor-chunks/uuid@8.3.2","vendor-chunks/yallist@4.0.0","vendor-chunks/preact-render-to-string@5.2.6_preact@10.27.1","vendor-chunks/lru-cache@6.0.0","vendor-chunks/cookie@0.5.0","vendor-chunks/@panva+hkdf@1.2.1","vendor-chunks/oidc-token-hash@5.1.1"], () => (__webpack_exec__("(rsc)/../../node_modules/.pnpm/next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&page=%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2F%5B...nextauth%5D%2Froute.ts&appDir=C%3A%5Calusa%5Capps%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Calusa%5Capps%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();