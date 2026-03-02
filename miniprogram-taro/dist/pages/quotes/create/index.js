"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/quotes/create/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/create/index!./src/pages/quotes/create/index.tsx":
/*!********************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/create/index!./src/pages/quotes/create/index.tsx ***!
  \********************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ QuoteCreatePage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);



/**
 * 报价创建向导页（简化入口）
 *
 * @description 先选客户，再进入商品选择器组成报价。
 * 完整创建建议导流至 Web 端，此处为移动端快速报价入口。
 */






function QuoteCreatePage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    customerId = _useState2[0],
    setCustomerId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    customerName = _useState4[0],
    setCustomerName = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    phone = _useState6[0],
    setPhone = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    address = _useState8[0],
    setAddress = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState9, 2),
    loading = _useState0[0],
    setLoading = _useState0[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(function (params) {
    // 从线索/CRM 页跳过来时携带 customerId
    if (params.customerId) setCustomerId(params.customerId);
  });
  var handleCreate = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!customerName && !customerId)) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '请填写客户信息',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            setLoading(true);
            _context.p = 2;
            _context.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.post('/quotes', {
              data: {
                customerId: customerId || undefined,
                customerName: customerName,
                phone: phone,
                address: address
              }
            });
          case 3:
            res = _context.v;
            if (res.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                title: '报价单已创建',
                icon: 'success'
              });
              setTimeout(function () {
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().redirectTo({
                  url: "/pages/quotes/product-selector/index?quoteId=".concat(res.data.id)
                });
              }, 1000);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                title: res.error || '创建失败',
                icon: 'none'
              });
            }
          case 4:
            _context.p = 4;
            setLoading(false);
            return _context.f(4);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[2,, 4, 5]]);
    }));
    return function handleCreate() {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "create-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "form-label",
        children: "\u5BA2\u6237\u59D3\u540D"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
        className: "form-input",
        placeholder: "\u8BF7\u8F93\u5165",
        value: customerName,
        onInput: function onInput(e) {
          return setCustomerName(e.detail.value);
        }
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "form-label",
        children: "\u8054\u7CFB\u7535\u8BDD"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
        className: "form-input",
        type: "number",
        maxlength: 11,
        placeholder: "\u8BF7\u8F93\u5165",
        value: phone,
        onInput: function onInput(e) {
          return setPhone(e.detail.value);
        }
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "form-label",
        children: "\u5B89\u88C5\u5730\u5740"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
        className: "form-input",
        placeholder: "\u5C0F\u533A\u540D\u3001\u95E8\u724C\u53F7",
        value: address,
        onInput: function onInput(e) {
          return setAddress(e.detail.value);
        }
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "hint-card card",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "hint-text",
        children: "\uD83D\uDCA1 \u521B\u5EFA\u540E\u8FDB\u5165\u5546\u54C1\u9009\u62E9\uFF0C\u53EF\u6DFB\u52A0\u591A\u4E2A\u623F\u95F4\u548C\u4EA7\u54C1\u3002\u590D\u6742\u62A5\u4EF7\u5EFA\u8BAE\u4F7F\u7528 Web \u7AEF\u5B8C\u6574\u7248\u3002"
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "form-footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn-submit",
        loading: loading,
        disabled: loading,
        onClick: handleCreate,
        children: "\u4E0B\u4E00\u6B65\uFF1A\u9009\u62E9\u5546\u54C1"
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/quotes/create/index.tsx":
/*!*******************************************!*\
  !*** ./src/pages/quotes/create/index.tsx ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/create/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/create/index!./src/pages/quotes/create/index.tsx");


var config = {"navigationBarTitleText":"create"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/quotes/create/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/quotes/create/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map