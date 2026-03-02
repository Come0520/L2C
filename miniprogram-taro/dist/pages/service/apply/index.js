"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/service/apply/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/service/apply/index!./src/pages/service/apply/index.tsx":
/*!********************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/service/apply/index!./src/pages/service/apply/index.tsx ***!
  \********************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ServiceApplyPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);






/**
 * 报修申请页
 */






function ServiceApplyPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_8__.useState)({
      orderNo: '',
      description: '',
      phone: ''
    }),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState, 2),
    form = _useState2[0],
    setForm = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_8__.useState)([]),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState3, 2),
    images = _useState4[0],
    setImages = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_8__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var update = function update(field) {
    return function (e) {
      return setForm(function (prev) {
        return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, prev), {}, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, field, e.detail.value));
      });
    };
  };
  var addImage = function addImage() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().chooseImage({
      count: 9 - images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function success(res) {
        return setImages(function (prev) {
          return [].concat((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(prev), (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(res.tempFilePaths)).slice(0, 9);
        });
      }
    });
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (form.description) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
              title: '请描述问题',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            setLoading(true);
            _context.p = 2;
            _context.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_9__.api.post('/service/apply', {
              data: (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, form), {}, {
                images: images
              })
            });
          case 3:
            res = _context.v;
            if (res.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
                title: '提交成功',
                icon: 'success'
              });
              setTimeout(function () {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().navigateBack();
              }, 1500);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
                title: res.error || '提交失败',
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
    className: "create-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "form-label",
        children: "\u8BA2\u5355\u7F16\u53F7\uFF08\u53EF\u9009\uFF09"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        className: "form-input",
        placeholder: "\u5173\u8054\u7684\u8BA2\u5355\u7F16\u53F7",
        value: form.orderNo,
        onInput: update('orderNo')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "form-label",
        children: "\u8054\u7CFB\u7535\u8BDD"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
        className: "form-input",
        type: "number",
        maxlength: 11,
        placeholder: "\u8BF7\u8F93\u5165",
        value: form.phone,
        onInput: update('phone')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "form-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "form-label",
        children: "\u95EE\u9898\u63CF\u8FF0 *"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Textarea, {
        className: "form-textarea",
        placeholder: "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u95EE\u9898...",
        value: form.description,
        onInput: update('description'),
        maxlength: 500
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "photo-section",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
        className: "form-label",
        children: "\u9644\u56FE"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "images-grid",
        children: [images.map(function (img, i) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Image, {
            className: "photo-thumb",
            src: img,
            mode: "aspectFill"
          }, i);
        }), images.length < 9 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "photo-add",
          onClick: addImage,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            children: "\uD83D\uDCF7"
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "form-footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Button, {
        className: "btn-submit",
        loading: loading,
        disabled: loading,
        onClick: handleSubmit,
        children: "\u63D0\u4EA4\u62A5\u4FEE"
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/service/apply/index.tsx":
/*!*******************************************!*\
  !*** ./src/pages/service/apply/index.tsx ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_service_apply_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/service/apply/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/service/apply/index!./src/pages/service/apply/index.tsx");


var config = {"navigationBarTitleText":"apply"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_service_apply_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/service/apply/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_service_apply_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_service_apply_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_service_apply_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_service_apply_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/service/apply/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map