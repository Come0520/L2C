"use strict";
require("./prebundle/vendors-node_modules_taro_weapp_prebundle_react-dom_js.js");
require("./prebundle/vendors-node_modules_taro_weapp_prebundle_chunk-43EJ54VY_js.js");
require("./prebundle/vendors-node_modules_taro_weapp_prebundle_chunk-XDFXK7K5_js.js");
require("./prebundle/vendors-node_modules_taro_weapp_prebundle_chunk-6EVYNAHE_js.js");
require("./prebundle/vendors-node_modules_taro_weapp_prebundle_tarojs_plugin-framework-react_dist_runtime_js.js");
require("./prebundle/vendors-node_modules_taro_weapp_prebundle_tarojs_plugin-platform-weapp_dist_runtime_js.js");
require("./prebundle/node_modules_taro_weapp_prebundle_tarojs_runtime_js.js");
require("./prebundle/node_modules_taro_weapp_prebundle_tarojs_taro_js.js");
require("./prebundle/remoteEntry.js");
require("./prebundle/node_modules_taro_weapp_prebundle_react_jsx-runtime_js.js");
require("./prebundle/node_modules_taro_weapp_prebundle_zustand_js.js");
require("./prebundle/node_modules_taro_weapp_prebundle_react_js.js");

require("./common");
require("./vendors");
require("./taro");
require("./runtime");

(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["app"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=app!./src/app.ts":
/*!***********************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=app!./src/app.ts ***!
  \***********************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/**
 * L2C 小程序入口文件
 *
 * @description Taro 应用根组件，用于包裹全局 Provider 和初始化逻辑。
 */




/**
 * 应用根组件
 * 在此处可添加全局 Provider（如 Zustand、主题等）
 */
function App(_ref) {
  var children = _ref.children;
  // 冷启动时恢复登录态：从 Storage 中读取 Token 和用户信息写入内存
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    _stores_auth__WEBPACK_IMPORTED_MODULE_1__.useAuthStore.getState().restore();
  }, []);
  return children;
}
/* harmony default export */ __webpack_exports__["default"] = (App);

/***/ }),

/***/ "./src/app.ts":
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_plugin_platform_weapp_dist_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/plugin-platform-weapp/dist/runtime */ "webpack/container/remote/@tarojs/plugin-platform-weapp/dist/runtime");
/* harmony import */ var _tarojs_plugin_platform_weapp_dist_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_plugin_platform_weapp_dist_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _tarojs_plugin_framework_react_dist_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/plugin-framework-react/dist/runtime */ "webpack/container/remote/@tarojs/plugin-framework-react/dist/runtime");
/* harmony import */ var _tarojs_plugin_framework_react_dist_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_tarojs_plugin_framework_react_dist_runtime__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_app_app_ts__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !!../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=app!./app.ts */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=app!./src/app.ts");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react-dom */ "webpack/container/remote/react-dom");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_6__);











var config = {"pages":["pages/landing/index","pages/landing/booking/index","pages/login/index","pages/register/index","pages/status/index","pages/workbench/index","pages/leads/index","pages/showroom/index","pages/tasks/index","pages/users/profile/index","pages/leads/detail/index","pages/quotes/index","pages/quotes/create/index","pages/quotes/detail/index","pages/quotes/product-selector/index","pages/crm/index","pages/crm/create/index","pages/crm/detail/index","pages/crm/followup/index","pages/users/edit/index","pages/reports/index"],"subPackages":[{"root":"pages/leads-sub","name":"leads","pages":["create/index","detail/index"]},{"root":"pages/showroom-sub","name":"showroom-sub","pages":["detail/index","capsule/index"]},{"root":"pages/service","name":"service","pages":["apply/index","list/index"]},{"root":"pages/projects","name":"projects","pages":["task-detail/index"]},{"root":"pages/invite","name":"invite","pages":["index"]},{"root":"pages/manager","name":"manager","pages":["targets/index"]},{"root":"pages/tenant","name":"tenant","pages":["payment-settings/index"]},{"root":"pages/orders","name":"orders","pages":["index","detail/index"]},{"root":"pages/tasks-sub","name":"tasks","pages":["detail/index","measure/index","customer-confirm/index"]},{"root":"pages/workbench-sub","name":"workbench","pages":["engineer/index"]}],"preloadRule":{"pages/workbench/index":{"network":"all","packages":["orders","manager"]},"pages/leads/index":{"network":"wifi","packages":["leads"]},"pages/tasks/index":{"network":"all","packages":["tasks"]}},"window":{"navigationBarTitleText":"L2C 窗帘全流程管理大师","navigationBarBackgroundColor":"#F2F2F7","navigationBarTextStyle":"black","backgroundColor":"#F2F2F7","backgroundTextStyle":"dark","initialRenderingCache":"static"},"tabBar":{"custom":true,"color":"#8E8E93","selectedColor":"#007AFF","borderStyle":"white","backgroundColor":"#F2F2F7","list":[{"pagePath":"pages/workbench/index","text":"工作台"},{"pagePath":"pages/leads/index","text":"线索"},{"pagePath":"pages/showroom/index","text":"展厅"},{"pagePath":"pages/tasks/index","text":"任务"},{"pagePath":"pages/users/profile/index","text":"我的"}]}};
_tarojs_runtime__WEBPACK_IMPORTED_MODULE_1__.window.__taroAppConfig = config
var inst = App((0,_tarojs_plugin_framework_react_dist_runtime__WEBPACK_IMPORTED_MODULE_2__.createReactApp)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_app_app_ts__WEBPACK_IMPORTED_MODULE_4__["default"], react__WEBPACK_IMPORTED_MODULE_5__, (react_dom__WEBPACK_IMPORTED_MODULE_6___default()), config))

;(0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_3__.initPxTransform)({
  designWidth: 750,
  deviceRatio: {"375":2,"640":1.17,"750":1,"828":0.905},
  baseFontSize: 20,
  unitPrecision: undefined,
  targetUnit: undefined
})


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["vendors","common"], function() { return __webpack_exec__("./src/app.ts"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);;;
//# sourceMappingURL=app.js.map