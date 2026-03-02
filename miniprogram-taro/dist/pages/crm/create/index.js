"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/crm/create/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/crm/create/index!./src/pages/crm/create/index.tsx":
/*!**************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/crm/create/index!./src/pages/crm/create/index.tsx ***!
  \**************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ CrmCreatePage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
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
 * 新建客户页
 */






function CrmCreatePage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_7__.useState)({
      name: '',
      phone: '',
      source: '',
      address: '',
      remark: ''
    }),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState, 2),
    form = _useState2[0],
    setForm = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_7__.useState)(false),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_4__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var update = function update(field) {
    return function (e) {
      return setForm(function (prev) {
        return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, prev), {}, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, field, e.detail.value));
      });
    };
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!form.name || !form.phone)) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '请填写客户姓名和手机号',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            setLoading(true);
            _context.p = 2;
            _context.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_8__.api.post('/crm/customers', {
              data: form
            });
          case 3:
            res = _context.v;
            if (res.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
                title: '创建成功',
                icon: 'success'
              });
              setTimeout(function () {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().navigateBack();
              }, 1500);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
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
    return function handleSubmit() {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    className: "create-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u5BA2\u6237\u59D3\u540D *"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        placeholder: "\u8BF7\u8F93\u5165",
        value: form.name,
        onInput: update('name')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u624B\u673A\u53F7 *"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        type: "number",
        maxlength: 11,
        placeholder: "\u8BF7\u8F93\u5165",
        value: form.phone,
        onInput: update('phone')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u6765\u6E90\u6E20\u9053"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        placeholder: "\u5982\uFF1A\u95E8\u5E97\u5230\u8BBF\u3001\u670B\u53CB\u4ECB\u7ECD",
        value: form.source,
        onInput: update('source')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u5730\u5740"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
        className: "form-input",
        placeholder: "\u5BA2\u6237\u5730\u5740",
        value: form.address,
        onInput: update('address')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "form-label",
        children: "\u5907\u6CE8"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Textarea, {
        className: "form-textarea",
        placeholder: "\u5907\u6CE8\u4FE1\u606F",
        value: form.remark,
        onInput: update('remark')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Button, {
        className: "btn-submit",
        loading: loading,
        disabled: loading,
        onClick: handleSubmit,
        children: "\u521B\u5EFA\u5BA2\u6237"
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/crm/create/index.tsx":
/*!****************************************!*\
  !*** ./src/pages/crm/create/index.tsx ***!
  \****************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_crm_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/crm/create/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/crm/create/index!./src/pages/crm/create/index.tsx");


var config = {"navigationBarTitleText":"create"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_crm_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/crm/create/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_crm_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_crm_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_crm_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_crm_create_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/crm/create/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map