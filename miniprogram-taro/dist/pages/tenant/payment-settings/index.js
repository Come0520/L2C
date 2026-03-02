"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/tenant/payment-settings/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tenant/payment-settings/index!./src/pages/tenant/payment-settings/index.tsx":
/*!****************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tenant/payment-settings/index!./src/pages/tenant/payment-settings/index.tsx ***!
  \****************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ PaymentSettingsPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);





/**
 * 租户收款设置页
 */






function PaymentSettingsPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_7__.useState)({
      bankName: '',
      accountName: '',
      accountNo: '',
      wechatPayId: ''
    }),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    form = _useState2[0],
    setForm = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_7__.useState)(false),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_6__.useDidShow)(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee() {
    var res, _t;
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          _context.p = 0;
          _context.n = 1;
          return _services_api__WEBPACK_IMPORTED_MODULE_8__.api.get('/tenant/payment-settings');
        case 1:
          res = _context.v;
          if (res.success && res.data) setForm(res.data);
          _context.n = 3;
          break;
        case 2:
          _context.p = 2;
          _t = _context.v;
        case 3:
          return _context.a(2);
      }
    }, _callee, null, [[0, 2]]);
  })));
  var update = function update(field) {
    return function (e) {
      return setForm(function (prev) {
        return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, prev), {}, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, field, e.detail.value));
      });
    };
  };
  var handleSave = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_3__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().m(function _callee2() {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            setLoading(true);
            _context2.p = 1;
            _context2.n = 2;
            return _services_api__WEBPACK_IMPORTED_MODULE_8__.api.put('/tenant/payment-settings', {
              data: form
            });
          case 2:
            res = _context2.v;
            if (res.success) _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '保存成功',
              icon: 'success'
            });else _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: res.error || '保存失败',
              icon: 'none'
            });
          case 3:
            _context2.p = 3;
            setLoading(false);
            return _context2.f(3);
          case 4:
            return _context2.a(2);
        }
      }, _callee2, null, [[1,, 3, 4]]);
    }));
    return function handleSave() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    className: "create-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
      className: "page-hint",
      children: "\u914D\u7F6E\u95E8\u5E97\u7684\u6536\u6B3E\u4FE1\u606F\uFF0C\u7528\u4E8E\u8BA2\u5355\u6536\u6B3E"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u5F00\u6237\u94F6\u884C"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        placeholder: "\u5982\uFF1A\u4E2D\u56FD\u94F6\u884C",
        value: form.bankName,
        onInput: update('bankName')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u6237\u540D"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        placeholder: "\u6536\u6B3E\u4EBA\u59D3\u540D",
        value: form.accountName,
        onInput: update('accountName')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u94F6\u884C\u8D26\u53F7"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        type: "number",
        placeholder: "\u94F6\u884C\u5361\u53F7",
        value: form.accountNo,
        onInput: update('accountNo')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u5FAE\u4FE1\u652F\u4ED8\u5546\u6237\u53F7\uFF08\u53EF\u9009\uFF09"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        placeholder: "\u5FAE\u4FE1\u5546\u6237\u53F7",
        value: form.wechatPayId,
        onInput: update('wechatPayId')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Button, {
        className: "btn-submit",
        loading: loading,
        disabled: loading,
        onClick: handleSave,
        children: "\u4FDD\u5B58\u8BBE\u7F6E"
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/tenant/payment-settings/index.tsx":
/*!*****************************************************!*\
  !*** ./src/pages/tenant/payment-settings/index.tsx ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tenant_payment_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tenant/payment-settings/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tenant/payment-settings/index!./src/pages/tenant/payment-settings/index.tsx");


var config = {"navigationBarTitleText":"payment-settings"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tenant_payment_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/tenant/payment-settings/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tenant_payment_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tenant_payment_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tenant_payment_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tenant_payment_settings_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/tenant/payment-settings/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map