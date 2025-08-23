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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ handler),\n/* harmony export */   POST: () => (/* binding */ handler),\n/* harmony export */   authConfig: () => (/* binding */ authConfig),\n/* harmony export */   signIn: () => (/* reexport safe */ next_auth_react__WEBPACK_IMPORTED_MODULE_3__.signIn),\n/* harmony export */   signOut: () => (/* reexport safe */ next_auth_react__WEBPACK_IMPORTED_MODULE_3__.signOut)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/../../node_modules/.pnpm/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma/node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/../../node_modules/.pnpm/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma/node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _lib_auth_auth_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/auth/auth-service */ \"(rsc)/./lib/auth/auth-service.ts\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next-auth/react */ \"(rsc)/../../node_modules/.pnpm/next-auth@4.24.8_next@14.2.5_@playwright+test@1.55.0_react-dom@18.3.1_react@18.3.1__react@18._jxt5wyau6hmnweyzz6neua2pma/node_modules/next-auth/react/index.js\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_3__);\n\n\n// prisma import removido (acesso indireto via auth-service se necessário)\n\n// Configuração NextAuth (v4). Evitar padrões de v5 (handlers, auth) pois pacote instalado é 4.x.\nconst authConfig = {\n    secret: process.env.NEXTAUTH_SECRET,\n    session: {\n        strategy: \"jwt\"\n    },\n    pages: {\n        signIn: \"/login\"\n    },\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Senha\",\n                    type: \"password\"\n                }\n            },\n            async authorize (creds) {\n                if (!creds?.email || !creds?.password) return null;\n                const r = await (0,_lib_auth_auth_service__WEBPACK_IMPORTED_MODULE_2__.verifyCredentials)(creds.email, creds.password);\n                if (!r) console.log(\"[auth] credenciais inv\\xe1lidas\", creds.email);\n                return r;\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id; // eslint-disable-line @typescript-eslint/no-explicit-any\n                token.role = user.role ?? \"USER\"; // eslint-disable-line @typescript-eslint/no-explicit-any\n                // garante email/name no token para sessão\n                if (!token.email && user.email) token.email = user.email; // eslint-disable-line @typescript-eslint/no-explicit-any\n                if (!token.name && user.name) token.name = user.name; // eslint-disable-line @typescript-eslint/no-explicit-any\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            session.user = {\n                id: token.id,\n                email: token.email,\n                name: token.name,\n                role: token.role ?? \"USER\" // eslint-disable-line @typescript-eslint/no-explicit-any\n            };\n            return session;\n        }\n    }\n};\n// Em NextAuth v4 no App Router, chamamos NextAuth(config) e reexportamos como GET/POST.\nconst handler = next_auth__WEBPACK_IMPORTED_MODULE_0___default()(authConfig);\n\n// Reexport utilidades client-side (não usadas server) para conveniência de imports.\n\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hdXRoLmNvbmZpZy50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUF1RDtBQUNHO0FBQzFELDBFQUEwRTtBQUNkO0FBRTVELGlHQUFpRztBQUMxRixNQUFNRyxhQUEwQjtJQUNyQ0MsUUFBUUMsUUFBUUMsR0FBRyxDQUFDQyxlQUFlO0lBQ25DQyxTQUFTO1FBQUVDLFVBQVU7SUFBTTtJQUMzQkMsT0FBTztRQUFFQyxRQUFRO0lBQVM7SUFDMUJDLFdBQVc7UUFDVFgsMkVBQVdBLENBQUM7WUFDVlksTUFBTTtZQUNOQyxhQUFhO2dCQUNYQyxPQUFPO29CQUFFQyxPQUFPO29CQUFTQyxNQUFNO2dCQUFRO2dCQUN2Q0MsVUFBVTtvQkFBRUYsT0FBTztvQkFBU0MsTUFBTTtnQkFBVztZQUMvQztZQUNBLE1BQU1FLFdBQVVDLEtBQUs7Z0JBQ25CLElBQUksQ0FBQ0EsT0FBT0wsU0FBUyxDQUFDSyxPQUFPRixVQUFVLE9BQU87Z0JBQ3BELE1BQU1HLElBQUksTUFBTW5CLHlFQUFpQkEsQ0FBQ2tCLE1BQU1MLEtBQUssRUFBRUssTUFBTUYsUUFBUTtnQkFDN0QsSUFBRyxDQUFDRyxHQUFHQyxRQUFRQyxHQUFHLENBQUMsbUNBQWdDSCxNQUFNTCxLQUFLO2dCQUM5RCxPQUFPTTtZQUNIO1FBQ0Y7S0FDRDtJQUNERyxXQUFXO1FBQ1QsTUFBTUMsS0FBSSxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRTtZQUN2QixJQUFJQSxNQUFNO2dCQUNQRCxNQUFjRSxFQUFFLEdBQUcsS0FBY0EsRUFBRSxFQUFFLHlEQUF5RDtnQkFDOUZGLE1BQWNHLElBQUksR0FBRyxLQUFjQSxJQUFJLElBQUksUUFBUSx5REFBeUQ7Z0JBQ25ILDBDQUEwQztnQkFDMUMsSUFBSSxDQUFDSCxNQUFNWCxLQUFLLElBQUksS0FBY0EsS0FBSyxFQUFFVyxNQUFNWCxLQUFLLEdBQUcsS0FBY0EsS0FBSyxFQUFFLHlEQUF5RDtnQkFDckksSUFBSSxDQUFDVyxNQUFNYixJQUFJLElBQUksS0FBY0EsSUFBSSxFQUFFYSxNQUFNYixJQUFJLEdBQUcsS0FBY0EsSUFBSSxFQUFFLHlEQUF5RDtZQUM3SDtZQUNBLE9BQU9hO1FBQ1Q7UUFDQSxNQUFNbEIsU0FBUSxFQUFFQSxPQUFPLEVBQUVrQixLQUFLLEVBQUU7WUFDN0JsQixRQUFnQm1CLElBQUksR0FBRztnQkFDdEJDLElBQUksTUFBZUEsRUFBRTtnQkFDckJiLE9BQU9XLE1BQU1YLEtBQUs7Z0JBQ2xCRixNQUFNYSxNQUFNYixJQUFJO2dCQUNoQmdCLE1BQU0sTUFBZUEsSUFBSSxJQUFJLE9BQU8seURBQXlEO1lBQy9GO1lBQ0EsT0FBT3JCO1FBQ1Q7SUFDRjtBQUNGLEVBQUU7QUFFRix3RkFBd0Y7QUFDeEYsTUFBTXNCLFVBQVU5QixnREFBUUEsQ0FBQ0c7QUFDa0I7QUFDM0Msb0ZBQW9GO0FBQ2xDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGFsdXNhL3dlYi8uL2F1dGguY29uZmlnLnRzPzQzMDgiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE5leHRBdXRoLCB7IHR5cGUgQXV0aE9wdGlvbnMgfSBmcm9tIFwibmV4dC1hdXRoXCI7XHJcbmltcG9ydCBDcmVkZW50aWFscyBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiO1xyXG4vLyBwcmlzbWEgaW1wb3J0IHJlbW92aWRvIChhY2Vzc28gaW5kaXJldG8gdmlhIGF1dGgtc2VydmljZSBzZSBuZWNlc3PDoXJpbylcclxuaW1wb3J0IHsgdmVyaWZ5Q3JlZGVudGlhbHMgfSBmcm9tIFwiLi9saWIvYXV0aC9hdXRoLXNlcnZpY2VcIjtcclxuXHJcbi8vIENvbmZpZ3VyYcOnw6NvIE5leHRBdXRoICh2NCkuIEV2aXRhciBwYWRyw7VlcyBkZSB2NSAoaGFuZGxlcnMsIGF1dGgpIHBvaXMgcGFjb3RlIGluc3RhbGFkbyDDqSA0LnguXHJcbmV4cG9ydCBjb25zdCBhdXRoQ29uZmlnOiBBdXRoT3B0aW9ucyA9IHtcclxuICBzZWNyZXQ6IHByb2Nlc3MuZW52Lk5FWFRBVVRIX1NFQ1JFVCxcclxuICBzZXNzaW9uOiB7IHN0cmF0ZWd5OiBcImp3dFwiIH0sXHJcbiAgcGFnZXM6IHsgc2lnbkluOiBcIi9sb2dpblwiIH0sXHJcbiAgcHJvdmlkZXJzOiBbXHJcbiAgICBDcmVkZW50aWFscyh7XHJcbiAgICAgIG5hbWU6IFwiY3JlZGVudGlhbHNcIixcclxuICAgICAgY3JlZGVudGlhbHM6IHtcclxuICAgICAgICBlbWFpbDogeyBsYWJlbDogXCJFbWFpbFwiLCB0eXBlOiBcImVtYWlsXCIgfSxcclxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCJTZW5oYVwiLCB0eXBlOiBcInBhc3N3b3JkXCIgfVxyXG4gICAgICB9LFxyXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZHMpIHtcclxuICAgICAgICBpZiAoIWNyZWRzPy5lbWFpbCB8fCAhY3JlZHM/LnBhc3N3b3JkKSByZXR1cm4gbnVsbDtcclxuICBjb25zdCByID0gYXdhaXQgdmVyaWZ5Q3JlZGVudGlhbHMoY3JlZHMuZW1haWwsIGNyZWRzLnBhc3N3b3JkKTtcclxuICBpZighcikgY29uc29sZS5sb2coJ1thdXRoXSBjcmVkZW5jaWFpcyBpbnbDoWxpZGFzJywgY3JlZHMuZW1haWwpO1xyXG4gIHJldHVybiByO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0sXHJcbiAgY2FsbGJhY2tzOiB7XHJcbiAgICBhc3luYyBqd3QoeyB0b2tlbiwgdXNlciB9KSB7XHJcbiAgICAgIGlmICh1c2VyKSB7XHJcbiAgICAgICAgKHRva2VuIGFzIGFueSkuaWQgPSAodXNlciBhcyBhbnkpLmlkOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgICAgICAodG9rZW4gYXMgYW55KS5yb2xlID0gKHVzZXIgYXMgYW55KS5yb2xlID8/ICdVU0VSJzsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XHJcbiAgLy8gZ2FyYW50ZSBlbWFpbC9uYW1lIG5vIHRva2VuIHBhcmEgc2Vzc8Ojb1xyXG4gIGlmICghdG9rZW4uZW1haWwgJiYgKHVzZXIgYXMgYW55KS5lbWFpbCkgdG9rZW4uZW1haWwgPSAodXNlciBhcyBhbnkpLmVtYWlsOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICBpZiAoIXRva2VuLm5hbWUgJiYgKHVzZXIgYXMgYW55KS5uYW1lKSB0b2tlbi5uYW1lID0gKHVzZXIgYXMgYW55KS5uYW1lOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdG9rZW47XHJcbiAgICB9LFxyXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcclxuICAgICAgKHNlc3Npb24gYXMgYW55KS51c2VyID0geyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgICAgICBpZDogKHRva2VuIGFzIGFueSkuaWQsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICAgIGVtYWlsOiB0b2tlbi5lbWFpbCxcclxuICAgICAgICBuYW1lOiB0b2tlbi5uYW1lLFxyXG4gICAgICAgIHJvbGU6ICh0b2tlbiBhcyBhbnkpLnJvbGUgPz8gJ1VTRVInIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gc2Vzc2lvbjtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vLyBFbSBOZXh0QXV0aCB2NCBubyBBcHAgUm91dGVyLCBjaGFtYW1vcyBOZXh0QXV0aChjb25maWcpIGUgcmVleHBvcnRhbW9zIGNvbW8gR0VUL1BPU1QuXHJcbmNvbnN0IGhhbmRsZXIgPSBOZXh0QXV0aChhdXRoQ29uZmlnKTtcclxuZXhwb3J0IHsgaGFuZGxlciBhcyBHRVQsIGhhbmRsZXIgYXMgUE9TVCB9O1xyXG4vLyBSZWV4cG9ydCB1dGlsaWRhZGVzIGNsaWVudC1zaWRlIChuw6NvIHVzYWRhcyBzZXJ2ZXIpIHBhcmEgY29udmVuacOqbmNpYSBkZSBpbXBvcnRzLlxyXG5leHBvcnQgeyBzaWduSW4sIHNpZ25PdXQgfSBmcm9tIFwibmV4dC1hdXRoL3JlYWN0XCI7XHJcbiJdLCJuYW1lcyI6WyJOZXh0QXV0aCIsIkNyZWRlbnRpYWxzIiwidmVyaWZ5Q3JlZGVudGlhbHMiLCJhdXRoQ29uZmlnIiwic2VjcmV0IiwicHJvY2VzcyIsImVudiIsIk5FWFRBVVRIX1NFQ1JFVCIsInNlc3Npb24iLCJzdHJhdGVneSIsInBhZ2VzIiwic2lnbkluIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsImNyZWRzIiwiciIsImNvbnNvbGUiLCJsb2ciLCJjYWxsYmFja3MiLCJqd3QiLCJ0b2tlbiIsInVzZXIiLCJpZCIsInJvbGUiLCJoYW5kbGVyIiwiR0VUIiwiUE9TVCIsInNpZ25PdXQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./auth.config.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth/auth-service.ts":
/*!**********************************!*\
  !*** ./lib/auth/auth-service.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   verifyCredentials: () => (/* binding */ verifyCredentials)\n/* harmony export */ });\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/../../node_modules/.pnpm/bcryptjs@3.0.2/node_modules/bcryptjs/index.js\");\n/* harmony import */ var _prisma__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../prisma */ \"(rsc)/./lib/prisma.ts\");\n\n\n/**\r\n * Verifica credenciais contra prisma.user (schema atual) e fallback prisma.usuario (legado).\r\n * Retorna objeto simplificado para sessão ou null se inválido.\r\n */ async function verifyCredentials(email, password) {\n    if (!email || !password) return null;\n    // Modelo User (atual) com Role relacionada\n    try {\n        const u = await _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma.user.findUnique({\n            where: {\n                email\n            },\n            include: {\n                role: true\n            }\n        });\n        if (u?.senhaHash) {\n            const ok = await bcryptjs__WEBPACK_IMPORTED_MODULE_0__[\"default\"].compare(password, u.senhaHash);\n            if (ok) {\n                // Prioriza perfil granular (ADMIN | PROFESSOR | RESPONSAVEL | ALUNO) se existir\n                const perfilRole = u.perfil; // eslint-disable-line @typescript-eslint/no-explicit-any\n                const role = perfilRole && [\n                    \"ADMIN\",\n                    \"PROFESSOR\",\n                    \"RESPONSAVEL\",\n                    \"ALUNO\"\n                ].includes(perfilRole) ? perfilRole : u.role?.name || \"USER\";\n                return {\n                    id: u.id,\n                    email: u.email,\n                    name: u.email.split(\"@\")[0],\n                    role\n                };\n            }\n        }\n    } catch (e) {\n        console.warn(\"[auth-service] erro user\", e.message);\n    }\n    // Fallback modelo legado Usuario se existir, incluindo perfil\n    try {\n        const anyPrisma = _prisma__WEBPACK_IMPORTED_MODULE_1__.prisma; // eslint-disable-line @typescript-eslint/no-explicit-any\n        if (anyPrisma.usuario) {\n            const uu = await anyPrisma.usuario.findUnique({\n                where: {\n                    email\n                }\n            });\n            if (uu?.senhaHash) {\n                const ok = await bcryptjs__WEBPACK_IMPORTED_MODULE_0__[\"default\"].compare(password, uu.senhaHash);\n                if (ok) {\n                    let role = uu?.role; // eslint-disable-line @typescript-eslint/no-explicit-any\n                    if (!role) {\n                        try {\n                            const ups = await anyPrisma.usuarioPerfil.findMany({\n                                where: {\n                                    usuarioId: uu.id\n                                },\n                                include: {\n                                    perfil: true\n                                },\n                                take: 1\n                            });\n                            role = ups?.[0]?.perfil?.nome;\n                        } catch  {}\n                    }\n                    role = role || \"USER\";\n                    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n                    return {\n                        id: uu.id,\n                        email: uu.email,\n                        name: uu.nome || uu.email,\n                        role\n                    };\n                }\n            }\n        }\n    } catch (e) {\n        console.warn(\"[auth-service] erro usuario legado\", e.message);\n    }\n    return null;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXV0aC9hdXRoLXNlcnZpY2UudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQThCO0FBQ0s7QUFJbkM7OztDQUdDLEdBQ00sZUFBZUUsa0JBQWtCQyxLQUFhLEVBQUVDLFFBQWdCO0lBQ3JFLElBQUksQ0FBQ0QsU0FBUyxDQUFDQyxVQUFVLE9BQU87SUFFaEMsMkNBQTJDO0lBQzNDLElBQUk7UUFDSixNQUFNQyxJQUFJLE1BQU1KLDJDQUFNQSxDQUFDSyxJQUFJLENBQUNDLFVBQVUsQ0FBQztZQUFFQyxPQUFPO2dCQUFFTDtZQUFNO1lBQUdNLFNBQVM7Z0JBQUVDLE1BQU07WUFBSztRQUFFO1FBQ2pGLElBQUlMLEdBQUdNLFdBQVc7WUFDaEIsTUFBTUMsS0FBSyxNQUFNWix3REFBYyxDQUFDSSxVQUFVQyxFQUFFTSxTQUFTO1lBQ3JELElBQUlDLElBQUk7Z0JBQ1YsZ0ZBQWdGO2dCQUNoRixNQUFNRSxhQUFhLEVBQVdDLE1BQU0sRUFBd0IseURBQXlEO2dCQUNySCxNQUFNTCxPQUFPLGNBQWU7b0JBQUM7b0JBQVE7b0JBQVk7b0JBQWM7aUJBQVEsQ0FBQ00sUUFBUSxDQUFDRixjQUFlQSxhQUFjVCxFQUFFSyxJQUFJLEVBQUVPLFFBQVE7Z0JBQ2hJLE9BQU87b0JBQUVDLElBQUliLEVBQUVhLEVBQUU7b0JBQUVmLE9BQU9FLEVBQUVGLEtBQUs7b0JBQUVjLE1BQU1aLEVBQUVGLEtBQUssQ0FBQ2dCLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFBRVQ7Z0JBQUs7WUFDakU7UUFDRjtJQUNGLEVBQUUsT0FBT1UsR0FBRztRQUNWQyxRQUFRQyxJQUFJLENBQUMsNEJBQTRCLEVBQWFDLE9BQU87SUFDL0Q7SUFFQSw4REFBOEQ7SUFDOUQsSUFBSTtRQUNGLE1BQU1DLFlBQVl2QiwyQ0FBTUEsRUFBUyx5REFBeUQ7UUFDMUYsSUFBSXVCLFVBQVVDLE9BQU8sRUFBRTtZQUNyQixNQUFNQyxLQUFLLE1BQU1GLFVBQVVDLE9BQU8sQ0FBQ2xCLFVBQVUsQ0FBQztnQkFBRUMsT0FBTztvQkFBRUw7Z0JBQU07WUFBRTtZQUNqRSxJQUFJdUIsSUFBSWYsV0FBVztnQkFDakIsTUFBTUMsS0FBSyxNQUFNWix3REFBYyxDQUFDSSxVQUFVc0IsR0FBR2YsU0FBUztnQkFDdEQsSUFBSUMsSUFBSTtvQkFDTixJQUFJRixPQUE0QmdCLElBQVloQixNQUFNLHlEQUF5RDtvQkFDM0csSUFBSSxDQUFDQSxNQUFNO3dCQUNULElBQUk7NEJBQ0YsTUFBTWlCLE1BQU0sTUFBTUgsVUFBVUksYUFBYSxDQUFDQyxRQUFRLENBQUM7Z0NBQ2pEckIsT0FBTztvQ0FBRXNCLFdBQVdKLEdBQUdSLEVBQUU7Z0NBQUM7Z0NBQzFCVCxTQUFTO29DQUFFTSxRQUFRO2dDQUFLO2dDQUN4QmdCLE1BQU07NEJBQ1I7NEJBQ0FyQixPQUFPaUIsS0FBSyxDQUFDLEVBQUUsRUFBRVosUUFBUWlCO3dCQUMzQixFQUFFLE9BQU0sQ0FBZTtvQkFDekI7b0JBQ0F0QixPQUFPQSxRQUFRO29CQUNmLDhEQUE4RDtvQkFDOUQsT0FBTzt3QkFBRVEsSUFBSVEsR0FBR1IsRUFBRTt3QkFBRWYsT0FBT3VCLEdBQUd2QixLQUFLO3dCQUFFYyxNQUFNLEdBQVllLElBQUksSUFBSU4sR0FBR3ZCLEtBQUs7d0JBQUVPO29CQUFLO2dCQUNoRjtZQUNGO1FBQ0Y7SUFDRixFQUFFLE9BQU9VLEdBQUc7UUFDVkMsUUFBUUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFhQyxPQUFPO0lBQ3pFO0lBRUEsT0FBTztBQUNUIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGFsdXNhL3dlYi8uL2xpYi9hdXRoL2F1dGgtc2VydmljZS50cz85NjU4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBiY3J5cHQgZnJvbSAnYmNyeXB0anMnO1xyXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tICcuLi9wcmlzbWEnO1xyXG5cclxuZXhwb3J0IHR5cGUgQXV0aFVzZXIgPSB7IGlkOiBzdHJpbmc7IGVtYWlsOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgcm9sZTogc3RyaW5nIH07XHJcblxyXG4vKipcclxuICogVmVyaWZpY2EgY3JlZGVuY2lhaXMgY29udHJhIHByaXNtYS51c2VyIChzY2hlbWEgYXR1YWwpIGUgZmFsbGJhY2sgcHJpc21hLnVzdWFyaW8gKGxlZ2FkbykuXHJcbiAqIFJldG9ybmEgb2JqZXRvIHNpbXBsaWZpY2FkbyBwYXJhIHNlc3PDo28gb3UgbnVsbCBzZSBpbnbDoWxpZG8uXHJcbiAqL1xyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZ5Q3JlZGVudGlhbHMoZW1haWw6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8QXV0aFVzZXIgfCBudWxsPiB7XHJcbiAgaWYgKCFlbWFpbCB8fCAhcGFzc3dvcmQpIHJldHVybiBudWxsO1xyXG5cclxuICAvLyBNb2RlbG8gVXNlciAoYXR1YWwpIGNvbSBSb2xlIHJlbGFjaW9uYWRhXHJcbiAgdHJ5IHtcclxuICBjb25zdCB1ID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7IHdoZXJlOiB7IGVtYWlsIH0sIGluY2x1ZGU6IHsgcm9sZTogdHJ1ZSB9IH0pO1xyXG4gICAgaWYgKHU/LnNlbmhhSGFzaCkge1xyXG4gICAgICBjb25zdCBvayA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKHBhc3N3b3JkLCB1LnNlbmhhSGFzaCk7XHJcbiAgICAgIGlmIChvaykge1xyXG4gICAgLy8gUHJpb3JpemEgcGVyZmlsIGdyYW51bGFyIChBRE1JTiB8IFBST0ZFU1NPUiB8IFJFU1BPTlNBVkVMIHwgQUxVTk8pIHNlIGV4aXN0aXJcclxuICAgIGNvbnN0IHBlcmZpbFJvbGUgPSAodSBhcyBhbnkpLnBlcmZpbCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgY29uc3Qgcm9sZSA9IChwZXJmaWxSb2xlICYmIFsnQURNSU4nLCdQUk9GRVNTT1InLCdSRVNQT05TQVZFTCcsJ0FMVU5PJ10uaW5jbHVkZXMocGVyZmlsUm9sZSkpID8gcGVyZmlsUm9sZSA6ICh1LnJvbGU/Lm5hbWUgfHwgJ1VTRVInKTtcclxuICByZXR1cm4geyBpZDogdS5pZCwgZW1haWw6IHUuZW1haWwsIG5hbWU6IHUuZW1haWwuc3BsaXQoJ0AnKVswXSwgcm9sZSB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS53YXJuKCdbYXV0aC1zZXJ2aWNlXSBlcnJvIHVzZXInLCAoZSBhcyBFcnJvcikubWVzc2FnZSk7XHJcbiAgfVxyXG5cclxuICAvLyBGYWxsYmFjayBtb2RlbG8gbGVnYWRvIFVzdWFyaW8gc2UgZXhpc3RpciwgaW5jbHVpbmRvIHBlcmZpbFxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBhbnlQcmlzbWEgPSBwcmlzbWEgYXMgYW55OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcclxuICAgIGlmIChhbnlQcmlzbWEudXN1YXJpbykge1xyXG4gICAgICBjb25zdCB1dSA9IGF3YWl0IGFueVByaXNtYS51c3VhcmlvLmZpbmRVbmlxdWUoeyB3aGVyZTogeyBlbWFpbCB9IH0pO1xyXG4gICAgICBpZiAodXU/LnNlbmhhSGFzaCkge1xyXG4gICAgICAgIGNvbnN0IG9rID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUocGFzc3dvcmQsIHV1LnNlbmhhSGFzaCk7XHJcbiAgICAgICAgaWYgKG9rKSB7XHJcbiAgICAgICAgICBsZXQgcm9sZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gKHV1IGFzIGFueSk/LnJvbGU7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICAgICAgaWYgKCFyb2xlKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdXBzID0gYXdhaXQgYW55UHJpc21hLnVzdWFyaW9QZXJmaWwuZmluZE1hbnkoe1xyXG4gICAgICAgICAgICAgICAgd2hlcmU6IHsgdXN1YXJpb0lkOiB1dS5pZCB9LFxyXG4gICAgICAgICAgICAgICAgaW5jbHVkZTogeyBwZXJmaWw6IHRydWUgfSxcclxuICAgICAgICAgICAgICAgIHRha2U6IDFcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICByb2xlID0gdXBzPy5bMF0/LnBlcmZpbD8ubm9tZTtcclxuICAgICAgICAgICAgfSBjYXRjaCB7IC8qIGlnbm9yZSAqLyB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb2xlID0gcm9sZSB8fCAnVVNFUic7XHJcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxyXG4gICAgICAgICAgcmV0dXJuIHsgaWQ6IHV1LmlkLCBlbWFpbDogdXUuZW1haWwsIG5hbWU6ICh1dSBhcyBhbnkpLm5vbWUgfHwgdXUuZW1haWwsIHJvbGUgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ1thdXRoLXNlcnZpY2VdIGVycm8gdXN1YXJpbyBsZWdhZG8nLCAoZSBhcyBFcnJvcikubWVzc2FnZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbnVsbDtcclxufVxyXG4iXSwibmFtZXMiOlsiYmNyeXB0IiwicHJpc21hIiwidmVyaWZ5Q3JlZGVudGlhbHMiLCJlbWFpbCIsInBhc3N3b3JkIiwidSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJpbmNsdWRlIiwicm9sZSIsInNlbmhhSGFzaCIsIm9rIiwiY29tcGFyZSIsInBlcmZpbFJvbGUiLCJwZXJmaWwiLCJpbmNsdWRlcyIsIm5hbWUiLCJpZCIsInNwbGl0IiwiZSIsImNvbnNvbGUiLCJ3YXJuIiwibWVzc2FnZSIsImFueVByaXNtYSIsInVzdWFyaW8iLCJ1dSIsInVwcyIsInVzdWFyaW9QZXJmaWwiLCJmaW5kTWFueSIsInVzdWFyaW9JZCIsInRha2UiLCJub21lIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth/auth-service.ts\n");

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