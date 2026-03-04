"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["common"],{

/***/ "./src/components/Skeleton/index.tsx":
/*!*******************************************!*\
  !*** ./src/components/Skeleton/index.tsx ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Skeleton: function() { return /* binding */ Skeleton; }
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);




/**
 * 骨架屏组件
 *
 * @description 数据加载时的占位动画，提升用户感知性能。
 * 支持列表、卡片、详情三种布局模式。
 */
var Skeleton = function Skeleton(_ref) {
  var loading = _ref.loading,
    _ref$rows = _ref.rows,
    rows = _ref$rows === void 0 ? 3 : _ref$rows,
    _ref$avatar = _ref.avatar,
    avatar = _ref$avatar === void 0 ? false : _ref$avatar,
    _ref$type = _ref.type,
    type = _ref$type === void 0 ? 'list' : _ref$type,
    children = _ref.children;
  if (!loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.Fragment, {
      children: children
    });
  }
  var renderRows = function renderRows(count) {
    var widths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    return Array.from({
      length: count
    }).map(function (_, index) {
      var width = widths[index] || (index === count - 1 ? '60%' : '100%');
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "skeleton__row",
        style: {
          width: width
        }
      }, index);
    });
  };
  var renderContent = function renderContent() {
    switch (type) {
      case 'card':
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "skeleton__card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
              className: "skeleton__avatar skeleton__avatar--square"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
              className: "skeleton__header-text",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
                className: "skeleton__row",
                style: {
                  width: '40%'
                }
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
                className: "skeleton__row",
                style: {
                  width: '30%'
                }
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__content",
            children: renderRows(rows, ['100%', '80%', '60%'])
          })]
        });
      case 'detail':
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "skeleton__detail",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__row skeleton__row--title",
            style: {
              width: '80%'
            }
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__spacing"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__content",
            children: renderRows(4, ['100%', '100%', '80%', '40%'])
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__spacing"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__content",
            children: renderRows(3, ['100%', '100%', '70%'])
          })]
        });
      case 'list':
      default:
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "skeleton__list",
          children: [avatar && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__avatar"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "skeleton__content",
            children: renderRows(rows, ['40%', '80%', '60%'])
          })]
        });
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
    className: "skeleton skeleton--".concat(type),
    children: renderContent()
  });
};

/***/ }),

/***/ "./src/components/TabBar/index.tsx":
/*!*****************************************!*\
  !*** ./src/components/TabBar/index.tsx ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ TabBar; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);

/**
 * 自定义 TabBar 组件
 *
 * @description 根据当前用户角色动态显示对应的 Tab 项。
 * 基于四大角色架构文档（2026-03-02），各角色可见 Tab 由 ROLE_TABS 控制。
 *
 * TabBar 槽位映射：
 * - 0: 工作台 (Manager, Sales)
 * - 1: 线索 (Sales)
 * - 2: 展厅 (Sales, Customer)
 * - 3: 任务 (Worker)
 * - 4: 我的 (全部角色)
 */






/** TabBar 单个项的配置 */

/** 全部 5 个 Tab 的完整配置（按槽位顺序） */
var ALL_TABS = [{
  index: 0,
  pagePath: '/pages/workbench/index',
  text: '工作台',
  icon: '/assets/icons/tab-workbench.png',
  iconSelected: '/assets/icons/tab-workbench-active.png'
}, {
  index: 1,
  pagePath: '/pages/leads/index',
  text: '线索',
  icon: '/assets/icons/tab-leads.png',
  iconSelected: '/assets/icons/tab-leads-active.png'
}, {
  index: 2,
  pagePath: '/pages/showroom/index',
  text: '展厅',
  icon: '/assets/icons/tab-showroom.png',
  iconSelected: '/assets/icons/tab-showroom-active.png'
}, {
  index: 3,
  pagePath: '/pages/tasks/index',
  text: '任务',
  icon: '/assets/icons/tab-tasks.png',
  iconSelected: '/assets/icons/tab-tasks-active.png'
}, {
  index: 4,
  pagePath: '/pages/users/profile/index',
  text: '我的',
  icon: '/assets/icons/tab-profile.png',
  iconSelected: '/assets/icons/tab-profile-active.png'
}];

/** TabBar 组件 Props */

/**
 * 自定义 TabBar 组件
 *
 * @example
 * ```tsx
 * // 在各 TabBar 页面底部使用
 * <TabBar selected='/pages/workbench/index' />
 * ```
 */
function TabBar(_ref) {
  var selected = _ref.selected;
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore)(),
    currentRole = _useAuthStore.currentRole;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)(selected || ''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 2),
    currentPath = _useState2[0],
    setCurrentPath = _useState2[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_2__.useDidShow)(function () {
    // 通过 getCurrentPages 获取当前路径
    var pages = _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().getCurrentPages();
    if (pages.length > 0) {
      var current = pages[pages.length - 1];
      setCurrentPath("/".concat(current.route));
    }
  });

  // 根据角色过滤可见 Tab
  var visibleIndexes = _stores_auth__WEBPACK_IMPORTED_MODULE_4__.ROLE_TABS[currentRole] || [];
  var visibleTabs = ALL_TABS.filter(function (tab) {
    return visibleIndexes.includes(tab.index);
  });

  /** 点击 Tab 跳转 */
  var handleTabClick = function handleTabClick(tab) {
    if (tab.pagePath === currentPath) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().switchTab({
      url: tab.pagePath
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
    className: "tab-bar safe-area-bottom",
    children: visibleTabs.map(function (tab) {
      var isActive = currentPath === tab.pagePath;
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "tab-bar__item ".concat(isActive ? 'tab-bar__item--active' : ''),
        onClick: function onClick() {
          return handleTabClick(tab);
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Image, {
          className: "tab-bar__icon",
          src: isActive ? tab.iconSelected : tab.icon,
          mode: "aspectFit"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "tab-bar__text",
          children: tab.text
        })]
      }, tab.index);
    })
  });
}

/***/ }),

/***/ "./src/services/api.ts":
/*!*****************************!*\
  !*** ./src/services/api.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   api: function() { return /* binding */ api; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var _utils_logger__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/utils/logger */ "./src/utils/logger.ts");



/**
 * API 请求封装
 *
 * @description 基于 Taro.request 的统一请求层，自动携带 JWT Token。
 * 从原生 getApp().request() 全局方法迁移为独立模块。
 */




/**
 * API 基础地址
 *
 * 注意：微信小程序真机无法直接访问 localhost。
 * 本地开发时（模拟器）：已自动切换为 http://localhost:3000/api/miniprogram。
 * 请务必在微信开发者工具「详情 → 本地设置」中勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」。
 * 如果需要真机调试，请将 localhost 改为您电脑的局域网 IP（例如 192.168.x.x）。
 */
var BASE_URL =  true ? 'http://localhost:3000/api/miniprogram' : 0;

/** 通用响应结构 */

/** 请求选项 */

/** 刷新锁：防止并发刷新 */
var isRefreshing = false;
/** 等待刷新完成的请求队列 */
var pendingQueue = [];

/**
 * 尝试使用微信 wx.login 无感刷新 Token
 * @returns 新 token 或 null
 */
function refreshToken() {
  return _refreshToken.apply(this, arguments);
}
/**
 * 发送 API 请求
 *
 * @param url - 请求路径（会自动拼接 BASE_URL）
 * @param options - 请求选项
 * @returns API 响应
 */
function _refreshToken() {
  _refreshToken = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
    var _res$data, loginRes, res, _res$data$data, token, user, _t2;
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          _context2.n = 1;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().login();
        case 1:
          loginRes = _context2.v;
          if (loginRes.code) {
            _context2.n = 2;
            break;
          }
          return _context2.a(2, null);
        case 2:
          _context2.n = 3;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().request({
            url: "".concat(BASE_URL, "/auth/wx-login"),
            method: 'POST',
            data: {
              code: loginRes.code
            },
            header: {
              'Content-Type': 'application/json'
            }
          });
        case 3:
          res = _context2.v;
          if (!(res.statusCode === 200 && (_res$data = res.data) !== null && _res$data !== void 0 && (_res$data = _res$data.data) !== null && _res$data !== void 0 && _res$data.token)) {
            _context2.n = 4;
            break;
          }
          _res$data$data = res.data.data, token = _res$data$data.token, user = _res$data$data.user; // 静默更新全局 Token 中状态
          _stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore.getState().setLogin(token, user);
          return _context2.a(2, token);
        case 4:
          return _context2.a(2, null);
        case 5:
          _context2.p = 5;
          _t2 = _context2.v;
          return _context2.a(2, null);
      }
    }, _callee2, null, [[0, 5]]);
  }));
  return _refreshToken.apply(this, arguments);
}
function request(_x) {
  return _request.apply(this, arguments);
}
/** 并发 GET 请求缓存，用于防抖和合并请求 */
function _request() {
  _request = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee3(url) {
    var options,
      _options$method,
      method,
      data,
      _options$header,
      header,
      _options$showLoading2,
      showLoading,
      _options$loadingText2,
      loadingText,
      _options$_retried,
      _retried,
      token,
      startTime,
      _res$data$data2,
      _res$data2,
      res,
      newToken,
      _err$errMsg,
      isNetworkError,
      _args3 = arguments,
      _t3;
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          options = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {};
          _options$method = options.method, method = _options$method === void 0 ? 'GET' : _options$method, data = options.data, _options$header = options.header, header = _options$header === void 0 ? {} : _options$header, _options$showLoading2 = options.showLoading, showLoading = _options$showLoading2 === void 0 ? false : _options$showLoading2, _options$loadingText2 = options.loadingText, loadingText = _options$loadingText2 === void 0 ? '加载中...' : _options$loadingText2, _options$_retried = options._retried, _retried = _options$_retried === void 0 ? false : _options$_retried; // 获取 Token
          token = _stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore.getState().token;
          if (showLoading) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().showLoading({
              title: loadingText,
              mask: true
            });
          }
          startTime = Date.now();
          _utils_logger__WEBPACK_IMPORTED_MODULE_5__.Logger.info('API', '发起请求', {
            method: method,
            url: url
          });
          _context3.p = 1;
          _context3.n = 2;
          return _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().request({
            url: "".concat(BASE_URL).concat(url),
            method: method,
            data: data,
            header: (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({
              'Content-Type': 'application/json'
            }, token ? {
              Authorization: "Bearer ".concat(token)
            } : {}), header)
          });
        case 2:
          res = _context3.v;
          if (showLoading) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().hideLoading();
          }
          _utils_logger__WEBPACK_IMPORTED_MODULE_5__.Logger.info('API', '请求成功', {
            method: method,
            url: url,
            statusCode: res.statusCode,
            duration: Date.now() - startTime
          });

          // HTTP 401 → 尝试无感刷新 Token
          if (!(res.statusCode === 401)) {
            _context3.n = 8;
            break;
          }
          if (_retried) {
            _context3.n = 7;
            break;
          }
          if (isRefreshing) {
            _context3.n = 6;
            break;
          }
          isRefreshing = true;
          _context3.n = 3;
          return refreshToken();
        case 3:
          newToken = _context3.v;
          isRefreshing = false;
          if (!newToken) {
            _context3.n = 4;
            break;
          }
          // 刷新成功，重试所有积压的请求
          pendingQueue.forEach(function (p) {
            return p.resolve(newToken);
          });
          pendingQueue = [];
          // 重试当前请求 (标记 _retried: true 防止无限循环)
          return _context3.a(2, request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
            _retried: true
          })));
        case 4:
          // 刷新失败，走正常登出报错逻辑
          pendingQueue.forEach(function (p) {
            return p.reject(new Error('刷新失败'));
          });
          pendingQueue = [];
        case 5:
          _context3.n = 7;
          break;
        case 6:
          return _context3.a(2, new Promise(function (_resolve, _reject) {
            pendingQueue.push({
              resolve: function resolve() {
                _resolve(request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
                  _retried: true
                })));
              },
              reject: function reject() {
                _reject(new Error('登录已过期'));
              }
            });
          }));
        case 7:
          // 如果已经重试过还是 401，或者刷新失败，执行登出
          _stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore.getState().logout();
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().navigateTo({
            url: '/pages/login/index'
          });
          return _context3.a(2, {
            success: false,
            data: null,
            error: '登录已过期'
          });
        case 8:
          if (!(res.statusCode >= 400)) {
            _context3.n = 9;
            break;
          }
          return _context3.a(2, {
            success: false,
            data: null,
            error: res.data && res.data.error || res.data && res.data.message || "\u8BF7\u6C42\u5931\u8D25 (".concat(res.statusCode, ")")
          });
        case 9:
          return _context3.a(2, {
            success: true,
            data: (_res$data$data2 = (_res$data2 = res.data) === null || _res$data2 === void 0 ? void 0 : _res$data2.data) !== null && _res$data$data2 !== void 0 ? _res$data$data2 : res.data
          });
        case 10:
          _context3.p = 10;
          _t3 = _context3.v;
          if (showLoading) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().hideLoading();
          }
          _utils_logger__WEBPACK_IMPORTED_MODULE_5__.Logger.error('API', '请求失败', _t3 instanceof Error ? _t3 : new Error(String(_t3.errMsg || _t3)), {
            method: method,
            url: url
          });
          isNetworkError = (_t3 === null || _t3 === void 0 || (_err$errMsg = _t3.errMsg) === null || _err$errMsg === void 0 ? void 0 : _err$errMsg.includes('request:fail')) || (_t3 === null || _t3 === void 0 ? void 0 : _t3.errMsg) === 'Failed to fetch' || (_t3 === null || _t3 === void 0 ? void 0 : _t3.message) === 'Network Error';
          if (!(method === 'GET' && isNetworkError && !_retried)) {
            _context3.n = 11;
            break;
          }
          _utils_logger__WEBPACK_IMPORTED_MODULE_5__.Logger.warn('API', '网络错误，重试一次', {
            method: method,
            url: url
          });
          return _context3.a(2, request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
            _retried: true
          })));
        case 11:
          return _context3.a(2, {
            success: false,
            data: null,
            error: _t3.errMsg || '网络请求失败'
          });
      }
    }, _callee3, null, [[1, 10]]);
  }));
  return _request.apply(this, arguments);
}
var pendingGets = new Map();
function getRequestKey(url, data) {
  return "".concat(url, "|").concat(JSON.stringify(data || {}));
}

/**
 * API 工具对象，提供便捷的 GET/POST/PUT/DELETE 方法
 *
 * @example
 * ```tsx
 * const res = await api.get('/dashboard')
 * const res = await api.post('/leads', { data: { name: '张三' } })
 * ```
 */
var api = {
  get: function get(url, options) {
    var key = getRequestKey(url, options === null || options === void 0 ? void 0 : options.data);
    if (pendingGets.has(key)) {
      return pendingGets.get(key);
    }
    var promise = request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
      method: 'GET'
    })).finally(function () {
      return pendingGets.delete(key);
    });
    pendingGets.set(key, promise);
    return promise;
  },
  post: function post(url, options) {
    return request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
      method: 'POST'
    }));
  },
  put: function put(url, options) {
    return request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
      method: 'PUT'
    }));
  },
  delete: function _delete(url, options) {
    return request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
      method: 'DELETE'
    }));
  },
  patch: function patch(url, options) {
    return request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
      method: 'PATCH'
    }));
  },
  upload: function () {
    var _upload = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(url, filePath) {
      var name,
        options,
        _options$showLoading,
        showLoading,
        _options$loadingText,
        loadingText,
        token,
        res,
        data,
        _args = arguments,
        _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            name = _args.length > 2 && _args[2] !== undefined ? _args[2] : 'file';
            options = _args.length > 3 && _args[3] !== undefined ? _args[3] : {};
            _options$showLoading = options.showLoading, showLoading = _options$showLoading === void 0 ? false : _options$showLoading, _options$loadingText = options.loadingText, loadingText = _options$loadingText === void 0 ? '上传中...' : _options$loadingText;
            token = _stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore.getState().token;
            if (showLoading) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().showLoading({
                title: loadingText,
                mask: true
              });
            }
            _context.p = 1;
            _context.n = 2;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().uploadFile({
              url: "".concat(BASE_URL).concat(url),
              filePath: filePath,
              name: name,
              header: (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, token ? {
                Authorization: "Bearer ".concat(token)
              } : {})
            });
          case 2:
            res = _context.v;
            if (showLoading) _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().hideLoading();
            data = JSON.parse(res.data);
            if (!(res.statusCode >= 400 || data && data.success === false)) {
              _context.n = 3;
              break;
            }
            return _context.a(2, {
              success: false,
              data: null,
              error: data.error || data.message || "\u4E0A\u4F20\u5931\u8D25 (".concat(res.statusCode, ")")
            });
          case 3:
            return _context.a(2, {
              success: true,
              data: data.data !== undefined ? data.data : data
            });
          case 4:
            _context.p = 4;
            _t = _context.v;
            if (showLoading) _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().hideLoading();
            return _context.a(2, {
              success: false,
              data: null,
              error: _t.errMsg || '网络请求失败'
            });
        }
      }, _callee, null, [[1, 4]]);
    }));
    function upload(_x2, _x3) {
      return _upload.apply(this, arguments);
    }
    return upload;
  }()
};

/***/ }),

/***/ "./src/services/task-service.ts":
/*!**************************************!*\
  !*** ./src/services/task-service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   taskService: function() { return /* binding */ taskService; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");




var taskService = {
  /**
   * 获取任务列表
   * GET /api/miniprogram/tasks
   * @param type 'measure' | 'install' | 'all'
   * @param status 任务状态过滤
   */
  getTaskList: function getTaskList(params) {
    return _api__WEBPACK_IMPORTED_MODULE_3__.api.get('/tasks', {
      data: params
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 获取单条任务详情
   * GET /api/miniprogram/tasks/:id
   */
  getTaskDetail: function getTaskDetail(id, type) {
    return _api__WEBPACK_IMPORTED_MODULE_3__.api.get("/tasks/".concat(id), {
      data: {
        type: type
      }
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 师傅打卡
   * POST /api/miniprogram/tasks/:id/check-in
   */
  checkIn: function checkIn(id, location) {
    return _api__WEBPACK_IMPORTED_MODULE_3__.api.post("/tasks/".concat(id, "/check-in"), {
      data: location
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 提交流量尺数据
   * POST /api/miniprogram/tasks/:id/measure-data
   */
  submitMeasureData: function submitMeasureData(id, reqData) {
    return _api__WEBPACK_IMPORTED_MODULE_3__.api.post("/tasks/".concat(id, "/measure-data"), {
      data: reqData
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 工单议价/接单/拒单操作
   * API: POST /miniprogram/tasks/:id/negotiate
   */
  negotiateTask: function negotiateTask(id, action, params) {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            return _context.a(2, _api__WEBPACK_IMPORTED_MODULE_3__.api.post("/tasks/".concat(id, "/negotiate"), {
              data: (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({
                action: action
              }, params)
            }));
        }
      }, _callee);
    }))();
  },
  /**
   * 量尺数据销售端复核/申诉
   * API: POST /miniprogram/tasks/:id/measure-verify
   */
  verifyMeasureData: function verifyMeasureData(id, action, disputeReason) {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            return _context2.a(2, _api__WEBPACK_IMPORTED_MODULE_3__.api.post("/tasks/".concat(id, "/measure-verify"), {
              data: {
                action: action,
                disputeReason: disputeReason
              }
            }));
        }
      }, _callee2);
    }))();
  }
};

/***/ }),

/***/ "./src/stores/auth.ts":
/*!****************************!*\
  !*** ./src/stores/auth.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ROLE_HOME: function() { return /* binding */ ROLE_HOME; },
/* harmony export */   ROLE_TABS: function() { return /* binding */ ROLE_TABS; },
/* harmony export */   useAuthStore: function() { return /* binding */ useAuthStore; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! zustand */ "webpack/container/remote/zustand");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(zustand__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");



/**
 * 认证状态管理 (Zustand)
 *
 * @description 基于最新四大角色架构设计文档（2026-03-02 已审批）重写。
 * 四大角色：Manager / Sales / Worker / Customer
 * 注意：`installer` 已废弃，统一使用 `worker`，与数据库枚举 `userRoleEnum` 一致。
 */




/**
 * 用户角色类型
 *
 * @description 四大核心角色 + 两个系统角色
 * - manager: 店长/管理员，2 Tab（工作台、我的）
 * - sales:   销售顾问，4 Tab（工作台、线索、云展厅、我的）
 * - worker:  安装工/测量师，2 Tab（任务、我的）
 * - customer: 客户，2 Tab（展厅、我的）
 * - guest:   未登录，不显示 Tab
 * - admin:   超级管理员（兼容旧数据，等同 manager）
 */

/** 用户信息接口 */

/**
 * 各角色对应的 TabBar 配置
 *
 * @description 基于 app.config.ts 中 tabBar.list 的槽位索引
 * 槽位：0=工作台, 1=线索, 2=展厅, 3=任务, 4=我的
 */
var ROLE_TABS = {
  manager: [0, 4],
  // 工作台、我的
  admin: [0, 4],
  // 同 manager（兼容旧数据）
  sales: [0, 1, 2, 4],
  // 工作台、线索、云展厅、我的
  worker: [3, 4],
  // 任务、我的
  customer: [2, 4],
  // 展厅、我的
  guest: [] // 未登录，不显示
};

/** 各角色的默认落地页（首次进入时跳转） */
var ROLE_HOME = {
  manager: '/pages/workbench/index',
  admin: '/pages/workbench/index',
  sales: '/pages/workbench/index',
  worker: '/pages/tasks/index',
  customer: '/pages/showroom/index',
  guest: '/pages/login/index'
};

/** 认证状态接口 */

/**
 * 认证状态 Store
 *
 * @example
 * ```tsx
 * const { isLoggedIn, currentRole, userInfo } = useAuthStore()
 * const tabs = ROLE_TABS[currentRole]   // 该角色可见的 Tab 索引
 * const home = ROLE_HOME[currentRole]   // 该角色的默认落地页
 * ```
 */
var useAuthStore = (0,zustand__WEBPACK_IMPORTED_MODULE_3__.create)(function (set) {
  return {
    userInfo: null,
    token: '',
    isLoggedIn: false,
    currentRole: 'guest',
    setLogin: function setLogin(token, userInfo) {
      var _userInfo$role;
      /**
       * 角色规范化：后端存储大写（ADMIN / BOSS / SALES），前端统一小写。
       * BOSS 在数据库中是管理员，映射到 manager 角色。
       */
      var rawRole = ((_userInfo$role = userInfo.role) === null || _userInfo$role === void 0 ? void 0 : _userInfo$role.toLowerCase()) || 'guest';
      var normalizedRole = rawRole === 'boss' ? 'manager' : rawRole;
      var normalizedUser = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, userInfo), {}, {
        role: normalizedRole
      });
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().setStorageSync('token', token);
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().setStorageSync('userInfo', normalizedUser);
      set({
        token: token,
        userInfo: normalizedUser,
        isLoggedIn: true,
        currentRole: normalizedRole
      });
    },
    logout: function logout() {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().removeStorageSync('token');
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().removeStorageSync('userInfo');
      set({
        token: '',
        userInfo: null,
        isLoggedIn: false,
        currentRole: 'guest'
      });
    },
    updateRole: function updateRole(role) {
      set(function (state) {
        if (state.userInfo) {
          var updated = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, state.userInfo), {}, {
            role: role
          });
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().setStorageSync('userInfo', updated);
          return {
            userInfo: updated,
            currentRole: role
          };
        }
        return {};
      });
    },
    restore: function restore() {
      try {
        var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getStorageSync('token');
        var userInfo = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getStorageSync('userInfo');
        if (token && userInfo) {
          var _userInfo$role2;
          // 兼容旧 Storage 中可能存在的大写角色
          var rawRole = ((_userInfo$role2 = userInfo.role) === null || _userInfo$role2 === void 0 ? void 0 : _userInfo$role2.toLowerCase()) || 'guest';
          var role = rawRole === 'boss' ? 'manager' : rawRole;
          set({
            token: token,
            userInfo: (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, userInfo), {}, {
              role: role
            }),
            isLoggedIn: true,
            currentRole: role
          });
        }
      } catch (e) {
        console.error('恢复登录态失败', e);
      }
    },
    restoreAndVerify: function () {
      var _restoreAndVerify = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
        var token, userInfo, res, _res$data$role, rawRole, role, normalizedUser, _t;
        return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              _context.p = 0;
              token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getStorageSync('token');
              userInfo = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getStorageSync('userInfo'); // Storage 为空，保持 guest 状态，无需网络请求
              if (!(!token || !userInfo)) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              // 先用 Storage 数据临时恢复，使后续 api 请求能携带 token
              set({
                token: token,
                userInfo: userInfo,
                isLoggedIn: true,
                currentRole: userInfo.role || 'guest'
              });

              // 调用 /auth/me 验证 token 有效性，并获取最新用户信息
              _context.n = 2;
              return _services_api__WEBPACK_IMPORTED_MODULE_5__.api.get('/auth/me');
            case 2:
              res = _context.v;
              if (res.success && res.data) {
                // Token 有效，角色规范化后更新 store
                rawRole = ((_res$data$role = res.data.role) === null || _res$data$role === void 0 ? void 0 : _res$data$role.toLowerCase()) || 'guest';
                role = rawRole === 'boss' ? 'manager' : rawRole;
                normalizedUser = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_2__["default"])({}, res.data), {}, {
                  role: role
                });
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().setStorageSync('userInfo', normalizedUser);
                set({
                  userInfo: normalizedUser,
                  currentRole: role
                });
              } else {
                // Token 无效或过期，清除所有登录态
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().removeStorageSync('token');
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().removeStorageSync('userInfo');
                set({
                  token: '',
                  userInfo: null,
                  isLoggedIn: false,
                  currentRole: 'guest'
                });
              }
              _context.n = 4;
              break;
            case 3:
              _context.p = 3;
              _t = _context.v;
              console.error('[Auth] restoreAndVerify 失败', _t);
              // 网络异常时保守处理：清除登录态，要求重新登录
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().removeStorageSync('token');
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().removeStorageSync('userInfo');
              set({
                token: '',
                userInfo: null,
                isLoggedIn: false,
                currentRole: 'guest'
              });
            case 4:
              return _context.a(2);
          }
        }, _callee, null, [[0, 3]]);
      }));
      function restoreAndVerify() {
        return _restoreAndVerify.apply(this, arguments);
      }
      return restoreAndVerify;
    }()
  };
});

/***/ }),

/***/ "./src/utils/logger.ts":
/*!*****************************!*\
  !*** ./src/utils/logger.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Logger: function() { return /* binding */ Logger; }
/* harmony export */ });
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/**
 * 结构化日志工具
 *
 * @description 统一的日志记录接口，自动附带时间戳和用户上下文。
 * 开发环境输出到 console，生产环境可对接微信实时日志。
 */


/** 日志级别 */

/** 日志条目 */

/**
 * 格式化日志条目
 */
function createEntry(level, module, action, data, error) {
  var userInfo = _stores_auth__WEBPACK_IMPORTED_MODULE_0__.useAuthStore.getState().userInfo;
  return {
    timestamp: new Date().toISOString(),
    level: level,
    module: module,
    action: action,
    userId: userInfo === null || userInfo === void 0 ? void 0 : userInfo.id,
    data: data,
    error: error === null || error === void 0 ? void 0 : error.message
  };
}
var Logger = {
  /** 信息日志 */info: function info(module, action, data) {
    var entry = createEntry('info', module, action, data);
    console.log("[".concat(entry.module, "] ").concat(entry.action), entry);
  },
  /** 警告日志 */warn: function warn(module, action, data) {
    var entry = createEntry('warn', module, action, data);
    console.warn("[".concat(entry.module, "] ").concat(entry.action), entry);
  },
  /** 错误日志 */error: function error(module, action, _error, data) {
    var entry = createEntry('error', module, action, data, _error);
    console.error("[".concat(entry.module, "] ").concat(entry.action), entry);
  }
};

/***/ }),

/***/ "./src/utils/route-guard.ts":
/*!**********************************!*\
  !*** ./src/utils/route-guard.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   requireAuth: function() { return /* binding */ requireAuth; },
/* harmony export */   requireRole: function() { return /* binding */ requireRole; }
/* harmony export */ });
/* unused harmony export isPublicPage */
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/**
 * 路由守卫工具
 *
 * @description 提供认证和角色两级权限校验。
 */



/** 不需要登录即可访问的页面白名单 */
var PUBLIC_PAGES = ['/pages/landing/index', '/pages/landing/booking/index', '/pages/login/index', '/pages/register/index', '/pages/status/index', '/packageSales/invite/index'];

/**
 * 检查是否为公开页面
 */
function isPublicPage(path) {
  return PUBLIC_PAGES.some(function (p) {
    return path.startsWith(p);
  });
}

/**
 * 认证守卫 — 确保用户已登录
 *
 * @returns true 表示已通过守卫，可继续执行
 */
function requireAuth() {
  var _useAuthStore$getStat = _stores_auth__WEBPACK_IMPORTED_MODULE_1__.useAuthStore.getState(),
    isLoggedIn = _useAuthStore$getStat.isLoggedIn;
  if (!isLoggedIn) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().redirectTo({
      url: '/pages/login/index'
    });
    return false;
  }
  return true;
}

/**
 * 角色守卫 — 确保当前角色有权访问
 *
 * @param allowedRoles - 允许访问的角色列表
 * @returns true 表示已通过守卫
 */
function requireRole(allowedRoles) {
  if (!requireAuth()) return false;
  var _useAuthStore$getStat2 = _stores_auth__WEBPACK_IMPORTED_MODULE_1__.useAuthStore.getState(),
    currentRole = _useAuthStore$getStat2.currentRole;
  if (!allowedRoles.includes(currentRole)) {
    // 跳转到该角色的默认首页
    var home = _stores_auth__WEBPACK_IMPORTED_MODULE_1__.ROLE_HOME[currentRole] || '/pages/login/index';
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().switchTab({
      url: home
    }).catch(function () {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_0___default().redirectTo({
        url: home
      });
    });
    return false;
  }
  return true;
}

/***/ }),

/***/ "./src/utils/validate.ts":
/*!*******************************!*\
  !*** ./src/utils/validate.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isNotEmpty: function() { return /* binding */ isNotEmpty; },
/* harmony export */   isValidEmail: function() { return /* binding */ isValidEmail; },
/* harmony export */   isValidLength: function() { return /* binding */ isValidLength; },
/* harmony export */   isValidPhone: function() { return /* binding */ isValidPhone; }
/* harmony export */ });
/**
 * 前端表单校验工具
 */

/** 校验 11 位中国手机号 */
function isValidPhone(phone) {
  if (!phone) return false;
  return /^1[3-9]\d{9}$/.test(phone.trim());
}

/** 非空校验（trim 后） */
function isNotEmpty(value) {
  if (value === undefined || value === null) return false;
  return value.trim().length > 0;
}

/** 长度校验 */
function isValidLength(value, min, max) {
  if (value === undefined || value === null) return false;
  var len = value.trim().length;
  return len >= min && len <= max;
}

/** 校验邮箱格式 */
function isValidEmail(email) {
  if (email === undefined || email === null) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/***/ })

}]);
//# sourceMappingURL=common.js.map