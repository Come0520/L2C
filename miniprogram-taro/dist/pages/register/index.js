"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/register/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/register/index!./src/pages/register/index.tsx":
/*!**********************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/register/index!./src/pages/register/index.tsx ***!
  \**********************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ RegisterPage; }
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











var REGIONS = ['北京市', '上海市', '天津市', '重庆市', '浙江省', '江苏省', '广东省', '福建省', '山东省', '河南省', '河北省', '湖南省', '湖北省', '四川省', '安徽省', '辽宁省', '吉林省', '黑龙江省', '山西省', '陕西省', '甘肃省', '云南省', '贵州省', '江西省', '海南省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区'];
function RegisterPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_7__.useState)({
      companyName: '',
      applicantName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      region: '',
      businessDescription: ''
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
  var handleRegionChange = function handleRegionChange(e) {
    setForm(function (prev) {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, prev), {}, {
        region: REGIONS[e.detail.value]
      });
    });
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!form.companyName || !form.applicantName || !form.phone || !form.password || !form.confirmPassword || !form.region)) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '请填写全部必填项',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            if (!(form.password !== form.confirmPassword)) {
              _context.n = 2;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '两次输入的密码不一致',
              icon: 'none'
            });
            return _context.a(2);
          case 2:
            if (!(form.password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password))) {
              _context.n = 3;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
              title: '密码至少8位且包含字母和数字',
              icon: 'none'
            });
            return _context.a(2);
          case 3:
            setLoading(true);
            _context.p = 4;
            _context.n = 5;
            return _services_api__WEBPACK_IMPORTED_MODULE_8__.api.post('/miniprogram/tenant/register', {
              data: form
            });
          case 5:
            res = _context.v;
            if (res.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().navigateTo({
                url: '/pages/status/index'
              });
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_6___default().showToast({
                title: res.error || '申请失败',
                icon: 'none'
              });
            }
          case 6:
            _context.p = 6;
            setLoading(false);
            return _context.f(6);
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[4,, 6, 7]]);
    }));
    return function handleSubmit() {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
    className: "register-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "page-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "page-title",
        children: "\u4F01\u4E1A\u5165\u9A7B"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        className: "page-desc",
        children: "\u586B\u5199\u4EE5\u4E0B\u4FE1\u606F\u7533\u8BF7\u5F00\u901A L2C \u667A\u80FD\u9500\u552E\u7BA1\u7406\u7CFB\u7EDF\u3002\u6211\u4EEC\u5C06\u4E3A\u60A8\u521D\u59CB\u5316\u72EC\u7ACB\u7684\u4E1A\u52A1\u4F01\u4E1A\u79DF\u6237\u3002"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-group-title",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        children: "\u57FA\u7840\u4FE1\u606F"
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-group",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u4F01\u4E1A\u540D\u79F0"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
          className: "form-input",
          placeholder: "\u8BF7\u8F93\u5165\u4F01\u4E1A\u5168\u79F0",
          placeholderClass: "ph-color",
          value: form.companyName,
          onInput: update('companyName')
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-divider"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u8054\u7CFB\u4EBA"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
          className: "form-input",
          placeholder: "\u60A8\u7684\u59D3\u540D",
          placeholderClass: "ph-color",
          value: form.applicantName,
          onInput: update('applicantName')
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-divider"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u624B\u673A\u53F7"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
          className: "form-input",
          type: "number",
          maxlength: 11,
          placeholder: "\u4F5C\u4E3A\u767B\u5F55\u8D26\u53F7",
          placeholderClass: "ph-color",
          value: form.phone,
          onInput: update('phone')
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-divider"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u6240\u5728\u5730\u533A"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Picker, {
          className: "form-input picker-input",
          mode: "selector",
          range: REGIONS,
          onChange: handleRegionChange,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
            className: form.region ? '' : 'ph-color',
            children: form.region || '请选择省份'
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-group-title",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        children: "\u5B89\u5168\u4FDD\u62A4"
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-group",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u8BBE\u7F6E\u5BC6\u7801"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
          className: "form-input",
          password: true,
          placeholder: "\u81F3\u5C118\u4F4D\u542B\u5B57\u6BCD\u6570\u5B57",
          placeholderClass: "ph-color",
          value: form.password,
          onInput: update('password')
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-divider"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u786E\u8BA4\u5BC6\u7801"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
          className: "form-input",
          password: true,
          placeholder: "\u8BF7\u518D\u6B21\u8F93\u5165\u5BC6\u7801",
          placeholderClass: "ph-color",
          value: form.confirmPassword,
          onInput: update('confirmPassword')
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-group-title",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
        children: "\u8865\u5145\u8BF4\u660E"
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-group",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
        className: "form-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Text, {
          className: "form-label",
          children: "\u4E1A\u52A1\u7B80\u4ECB"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Input, {
          className: "form-input",
          placeholder: "\u7B80\u8981\u4ECB\u7ECD\u4E3B\u8425\u4E1A\u52A1 (\u9009\u586B)",
          placeholderClass: "ph-color",
          value: form.businessDescription,
          onInput: update('businessDescription')
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.View, {
      className: "form-footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_5__.Button, {
        className: "btn-submit",
        loading: loading,
        disabled: loading,
        onClick: handleSubmit,
        children: "\u63D0\u4EA4\u5165\u9A7B\u7533\u8BF7"
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/register/index.tsx":
/*!**************************************!*\
  !*** ./src/pages/register/index.tsx ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_register_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/register/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/register/index!./src/pages/register/index.tsx");


var config = {"navigationBarTitleText":"入驻申请","navigationBarBackgroundColor":"#F5F5F7","navigationBarTextStyle":"black"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_register_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/register/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_register_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_register_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_register_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_register_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/register/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map