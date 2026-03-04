"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["custom-tab-bar/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=custom-tab-bar/index!./src/custom-tab-bar/index.tsx":
/*!**********************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=custom-tab-bar/index!./src/custom-tab-bar/index.tsx ***!
  \**********************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ CustomTabBar; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);



/**
 * 微信原生自定义 TabBar 的占位组件
 *
 * @description 因为 app.config.ts 开启了 `custom: true`，微信强制要求必须有此目录。
 * 本项目中，真实的 TabBar 已在各个页面级组件（如 pages/workbench/index）的底部手动引入，
 * 为了避免双重渲染和体验隔离问题，原生的 custom-tab-bar 这里直接渲染为空视图（占位），
 * 依靠页面的 <TabBar /> 提供真实的 UI。
 */

function CustomTabBar() {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
    className: "custom-tab-bar-placeholder"
  });
}

/***/ }),

/***/ "./src/custom-tab-bar/index.tsx":
/*!**************************************!*\
  !*** ./src/custom-tab-bar/index.tsx ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_custom_tab_bar_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=custom-tab-bar/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=custom-tab-bar/index!./src/custom-tab-bar/index.tsx");


var inst = Component((0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createComponentConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_custom_tab_bar_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'custom-tab-bar/index'))

/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_custom_tab_bar_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","common"], function() { return __webpack_exec__("./src/custom-tab-bar/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map