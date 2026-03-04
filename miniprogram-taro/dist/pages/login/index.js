"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/login/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/login/index!./src/pages/login/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/login/index!./src/pages/login/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LoginPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var _utils_validate__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/utils/validate */ "./src/utils/validate.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);



/**
 * 登录页
 *
 * @description 支持三种登录方式：账号密码 / 微信授权 / 手机号一键登录
 * 登录成功后根据用户角色跳转至对应落地页（ROLE_HOME）。
 */








/** 当前选中的登录 Tab */

function LoginPage() {
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_6__.useAuthStore)(),
    setLogin = _useAuthStore.setLogin;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)('password'),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    phone = _useState4[0],
    setPhone = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    password = _useState6[0],
    setPassword = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    loading = _useState8[0],
    setLoading = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState9, 2),
    error = _useState0[0],
    setError = _useState0[1];

  /** 账号密码登录 */
  var handlePasswordLogin = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var res, home, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if ((0,_utils_validate__WEBPACK_IMPORTED_MODULE_8__.isNotEmpty)(phone)) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '请输入账号（手机号码）',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            if ((0,_utils_validate__WEBPACK_IMPORTED_MODULE_8__.isValidPhone)(phone)) {
              _context.n = 2;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '请输入正确的手机号码',
              icon: 'none'
            });
            return _context.a(2);
          case 2:
            if ((0,_utils_validate__WEBPACK_IMPORTED_MODULE_8__.isValidLength)(password, 6, 128)) {
              _context.n = 3;
              break;
            }
            // 假设密码最长不受限太多，最小为 6
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '密码长度至少为 6 位',
              icon: 'none'
            });
            return _context.a(2);
          case 3:
            setLoading(true);
            setError('');
            _context.p = 4;
            _context.n = 5;
            return _services_api__WEBPACK_IMPORTED_MODULE_7__.api.post('/auth/login', {
              data: {
                account: phone,
                password: password
              }
            });
          case 5:
            res = _context.v;
            if (!res.success) {
              _context.n = 10;
              break;
            }
            setLogin(res.data.token, res.data.user);
            home = _stores_auth__WEBPACK_IMPORTED_MODULE_6__.ROLE_HOME[res.data.user.role] || '/pages/workbench/index';
            _context.p = 6;
            _context.n = 7;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().switchTab({
              url: home
            });
          case 7:
            _context.n = 9;
            break;
          case 8:
            _context.p = 8;
            _t = _context.v;
            console.warn('[Login] switchTab 失败，尝试 reLaunch', _t);
            _context.n = 9;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().reLaunch({
              url: home
            });
          case 9:
            _context.n = 11;
            break;
          case 10:
            setError(res.error || '登录失败，请检查账号密码');
          case 11:
            _context.p = 11;
            setLoading(false);
            return _context.f(11);
          case 12:
            return _context.a(2);
        }
      }, _callee, null, [[6, 8], [4,, 11, 12]]);
    }));
    return function handlePasswordLogin() {
      return _ref.apply(this, arguments);
    };
  }();

  /** 微信授权登录 */
  var handleWechatLogin = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
      var loginRes, res, home, _t2, _t3;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            setLoading(true);
            setError('');
            _context2.p = 1;
            _context2.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().login();
          case 2:
            loginRes = _context2.v;
            _context2.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_7__.api.post('/auth/wx-login', {
              data: {
                code: loginRes.code
              }
            });
          case 3:
            res = _context2.v;
            if (!res.success) {
              _context2.n = 8;
              break;
            }
            setLogin(res.data.token, res.data.user);
            home = _stores_auth__WEBPACK_IMPORTED_MODULE_6__.ROLE_HOME[res.data.user.role] || '/pages/workbench/index';
            _context2.p = 4;
            _context2.n = 5;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().switchTab({
              url: home
            });
          case 5:
            _context2.n = 7;
            break;
          case 6:
            _context2.p = 6;
            _t2 = _context2.v;
            console.warn('[Wechat] switchTab 失败，尝试 reLaunch', _t2);
            _context2.n = 7;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().reLaunch({
              url: home
            });
          case 7:
            _context2.n = 9;
            break;
          case 8:
            setError(res.error || '微信登录失败');
          case 9:
            _context2.n = 11;
            break;
          case 10:
            _context2.p = 10;
            _t3 = _context2.v;
            setError('微信授权失败，请重试');
          case 11:
            _context2.p = 11;
            setLoading(false);
            return _context2.f(11);
          case 12:
            return _context2.a(2);
        }
      }, _callee2, null, [[4, 6], [1, 10, 11, 12]]);
    }));
    return function handleWechatLogin() {
      return _ref2.apply(this, arguments);
    };
  }();

  /** 前往注册/入驻申请 */
  var goRegister = function goRegister() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateTo({
      url: '/pages/register/index'
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "login-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "login-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "login-logo",
        children: "L2C"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "login-subtitle",
        children: "\u7A97\u5E18\u5168\u6D41\u7A0B\u7BA1\u7406\u5927\u5E08"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "login-tabs",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "login-tab ".concat(activeTab === 'password' ? 'login-tab--active' : ''),
        onClick: function onClick() {
          return setActiveTab('password');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u8D26\u53F7\u767B\u5F55"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "login-tab ".concat(activeTab === 'wechat' ? 'login-tab--active' : ''),
        onClick: function onClick() {
          return setActiveTab('wechat');
        },
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u5FAE\u4FE1\u767B\u5F55"
        })
      })]
    }), activeTab === 'password' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "login-form-container",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "apple-list-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "apple-list-label",
          children: "\u624B\u673A\u53F7"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
          className: "apple-list-input",
          type: "number",
          maxlength: 11,
          placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7\u7801",
          "placeholder-class": "ph-color",
          value: phone,
          onInput: function onInput(e) {
            return setPhone(e.detail.value);
          }
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "apple-list-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "apple-list-label",
          children: "\u5B89\u5168\u5BC6\u7801"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
          className: "apple-list-input",
          password: true,
          placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801",
          "placeholder-class": "ph-color",
          value: password,
          onInput: function onInput(e) {
            return setPassword(e.detail.value);
          }
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "login-actions",
      children: [error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "error-text",
        children: error
      }), activeTab === 'password' ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "apple-btn-primary",
        loading: loading,
        disabled: loading,
        onClick: handlePasswordLogin,
        children: "\u767B \u5F55"
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "apple-btn-primary",
        style: {
          backgroundColor: '#21C042'
        } // WeChat Green
        ,
        loading: loading,
        disabled: loading,
        onClick: handleWechatLogin,
        children: "\u5FAE\u4FE1\u4E00\u952E\u767B\u5F55"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "login-footer",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "footer-text",
        children: "\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "footer-link",
        onClick: goRegister,
        children: "\u7533\u8BF7\u5165\u9A7B"
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/login/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/login/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_login_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/login/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/login/index!./src/pages/login/index.tsx");


var config = {"navigationBarTitleText":"登录","navigationBarBackgroundColor":"#F2F2F7","navigationBarTextStyle":"black"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_login_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/login/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_login_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_login_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_login_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_login_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/login/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map