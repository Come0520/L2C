"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/landing/booking/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/booking/index!./src/pages/landing/booking/index.tsx":
/*!************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/booking/index!./src/pages/landing/booking/index.tsx ***!
  \************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ BookingPage; }
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
 * 租户专属落地页 - 预约表单
 *
 * @description 客户在此填写的表单，直接成为该租户系统内的线索。
 */






function BookingPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    tenantCode = _useState2[0],
    setTenantCode = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    submitted = _useState6[0],
    setSubmitted = _useState6[1];

  // 表单状态
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    customerName = _useState8[0],
    setCustomerName = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState9, 2),
    customerPhone = _useState0[0],
    setCustomerPhone = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState10 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState1, 2),
    region = _useState10[0],
    setRegion = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState12 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState11, 2),
    detailAddress = _useState12[0],
    setDetailAddress = _useState12[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(function (options) {
    if (options.tc) {
      setTenantCode(options.tc);
    } else {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(function () {
        return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack();
      }, 1500);
    }
  });

  // 校验手机号
  var validatePhone = function validatePhone(phone) {
    return /^1\d{10}$/.test(phone);
  };

  /** 提交预约表单 */
  var handleSubmit = (0,react__WEBPACK_IMPORTED_MODULE_5__.useCallback)(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
    var res, _t;
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          if (customerName.trim()) {
            _context.n = 1;
            break;
          }
          return _context.a(2, _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
            title: '请输入姓名',
            icon: 'none'
          }));
        case 1:
          if (validatePhone(customerPhone)) {
            _context.n = 2;
            break;
          }
          return _context.a(2, _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
            title: '手机号格式错误',
            icon: 'none'
          }));
        case 2:
          if (region) {
            _context.n = 3;
            break;
          }
          return _context.a(2, _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
            title: '请选择所在地区',
            icon: 'none'
          }));
        case 3:
          setLoading(true);
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
            title: '提交中...',
            mask: true
          });
          _context.p = 4;
          _context.n = 5;
          return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.post('/miniprogram/tenant/public-booking', {
            data: {
              tenantCode: tenantCode,
              customerName: customerName,
              customerPhone: customerPhone,
              region: region,
              detailAddress: detailAddress
            }
          });
        case 5:
          res = _context.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
          if (res.success) {
            setSubmitted(true);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '预约成功',
              icon: 'success'
            });
          } else {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: res.error || '提交失败',
              icon: 'none'
            });
          }
          _context.n = 7;
          break;
        case 6:
          _context.p = 6;
          _t = _context.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
            title: _t.message || '网络异常',
            icon: 'none'
          });
        case 7:
          _context.p = 7;
          setLoading(false);
          return _context.f(7);
        case 8:
          return _context.a(2);
      }
    }, _callee, null, [[4, 6, 7, 8]]);
  })), [tenantCode, customerName, customerPhone, region, detailAddress]);
  var goBack = function goBack() {
    return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack();
  };
  if (submitted) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "booking-page success-view",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "success-icon",
        children: "\uD83C\uDF89"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "success-title",
        children: "\u9884\u7EA6\u6210\u529F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "success-desc",
        children: "\u60A8\u7684\u4FE1\u606F\u5DF2\u63D0\u4EA4\uFF0C\u6211\u4EEC\u7684\u4E13\u5C5E\u987E\u95EE\u4F1A\u5C3D\u5FEB\u4E0E\u60A8\u8054\u7CFB\uFF01"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn-primary mt-xl",
        onClick: goBack,
        children: "\u8FD4\u56DE\u9996\u9875"
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "booking-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "booking-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "header-title",
        children: "\u4E13\u5C5E\u9884\u7EA6\u767B\u8BB0"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "header-desc",
        children: "\u7559\u4E0B\u60A8\u7684\u8054\u7CFB\u65B9\u5F0F\uFF0C\u4F53\u9A8C\u4E13\u4E1A\u7A97\u5E18\u5B9A\u5236\u670D\u52A1"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "form-card",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "form-label",
          children: ["\u60A8\u7684\u59D3\u540D ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "required",
            children: "*"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
          className: "form-input",
          placeholder: "\u8BF7\u8F93\u5165\u60A8\u7684\u79F0\u547C",
          value: customerName,
          onInput: function onInput(e) {
            return setCustomerName(e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "form-label",
          children: ["\u8054\u7CFB\u7535\u8BDD ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "required",
            children: "*"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
          className: "form-input",
          type: "number",
          maxlength: 11,
          placeholder: "\u8BF7\u8F93\u516511\u4F4D\u624B\u673A\u53F7\u7801",
          value: customerPhone,
          onInput: function onInput(e) {
            return setCustomerPhone(e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "form-label",
          children: ["\u6240\u5728\u5730\u533A ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "required",
            children: "*"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Picker, {
          mode: "region",
          onChange: function onChange(e) {
            // 微信原生 region picker 返回的是 ['省', '市', '区'] 数组
            setRegion(e.detail.value.join(' '));
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "form-input picker-value ".concat(!region ? 'placeholder' : ''),
            children: region || '请选择省/市/区'
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "form-item",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "form-label",
          children: "\u8BE6\u7EC6\u5730\u5740/\u5C0F\u533A"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
          className: "form-input",
          placeholder: "\u5982\uFF1A\u67D0\u67D0\u5C0F\u533AX\u680BX\u5355\u5143\uFF08\u9009\u586B\uFF09",
          value: detailAddress,
          onInput: function onInput(e) {
            return setDetailAddress(e.detail.value);
          }
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "booking-actions",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn-primary",
        loading: loading,
        disabled: loading || !customerName || !customerPhone || !region,
        onClick: handleSubmit,
        children: "\u7ACB\u5373\u63D0\u4EA4\u9884\u7EA6"
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/landing/booking/index.tsx":
/*!*********************************************!*\
  !*** ./src/pages/landing/booking/index.tsx ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_booking_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/booking/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/booking/index!./src/pages/landing/booking/index.tsx");


var config = {"navigationBarTitleText":"预约上门量尺","navigationBarBackgroundColor":"#F2F2F7","navigationBarTextStyle":"black"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_booking_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/landing/booking/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_booking_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_booking_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_booking_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_booking_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/landing/booking/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map