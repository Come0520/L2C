"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["common"],{

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



/**
 * API 请求封装
 *
 * @description 基于 Taro.request 的统一请求层，自动携带 JWT Token。
 * 从原生 getApp().request() 全局方法迁移为独立模块。
 */



/** API 基础地址 — 根据环境自动切换 */
var BASE_URL =  true ? 'http://localhost:3000/api' : 0;

/** 通用响应结构 */

/** 请求选项 */
/**
 * 发送 API 请求
 *
 * @param url - 请求路径（会自动拼接 BASE_URL）
 * @param options - 请求选项
 * @returns API 响应
 */
function request(_x) {
  return _request.apply(this, arguments);
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
function _request() {
  _request = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(url) {
    var options,
      _options$method,
      method,
      data,
      _options$header,
      header,
      _options$showLoading,
      showLoading,
      _options$loadingText,
      loadingText,
      token,
      _res$data$data,
      _res$data2,
      res,
      _res$data,
      _args = arguments,
      _t;
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
          _options$method = options.method, method = _options$method === void 0 ? 'GET' : _options$method, data = options.data, _options$header = options.header, header = _options$header === void 0 ? {} : _options$header, _options$showLoading = options.showLoading, showLoading = _options$showLoading === void 0 ? false : _options$showLoading, _options$loadingText = options.loadingText, loadingText = _options$loadingText === void 0 ? '加载中...' : _options$loadingText; // 获取 Token
          token = _stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore.getState().token;
          if (showLoading) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().showLoading({
              title: loadingText,
              mask: true
            });
          }
          _context.p = 1;
          _context.n = 2;
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
          res = _context.v;
          if (showLoading) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().hideLoading();
          }

          // HTTP 401 → 自动登出
          if (!(res.statusCode === 401)) {
            _context.n = 3;
            break;
          }
          _stores_auth__WEBPACK_IMPORTED_MODULE_4__.useAuthStore.getState().logout();
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().navigateTo({
            url: '/pages/login/index'
          });
          return _context.a(2, {
            success: false,
            data: null,
            error: '登录已过期'
          });
        case 3:
          if (!(res.statusCode >= 400)) {
            _context.n = 4;
            break;
          }
          return _context.a(2, {
            success: false,
            data: null,
            error: ((_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.message) || "\u8BF7\u6C42\u5931\u8D25 (".concat(res.statusCode, ")")
          });
        case 4:
          return _context.a(2, {
            success: true,
            data: (_res$data$data = (_res$data2 = res.data) === null || _res$data2 === void 0 ? void 0 : _res$data2.data) !== null && _res$data$data !== void 0 ? _res$data$data : res.data
          });
        case 5:
          _context.p = 5;
          _t = _context.v;
          if (showLoading) {
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().hideLoading();
          }
          console.error("API \u8BF7\u6C42\u5931\u8D25: ".concat(method, " ").concat(url), _t);
          return _context.a(2, {
            success: false,
            data: null,
            error: _t.errMsg || '网络请求失败'
          });
      }
    }, _callee, null, [[1, 5]]);
  }));
  return _request.apply(this, arguments);
}
var api = {
  get: function get(url, options) {
    return request(url, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, options), {}, {
      method: 'GET'
    }));
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
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! zustand */ "webpack/container/remote/zustand");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(zustand__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_2__);

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
var useAuthStore = (0,zustand__WEBPACK_IMPORTED_MODULE_1__.create)(function (set) {
  return {
    userInfo: null,
    token: '',
    isLoggedIn: false,
    currentRole: 'guest',
    setLogin: function setLogin(token, userInfo) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().setStorageSync('token', token);
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().setStorageSync('userInfo', userInfo);
      set({
        token: token,
        userInfo: userInfo,
        isLoggedIn: true,
        currentRole: userInfo.role || 'guest'
      });
    },
    logout: function logout() {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().removeStorageSync('token');
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().removeStorageSync('userInfo');
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
          var updated = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, state.userInfo), {}, {
            role: role
          });
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().setStorageSync('userInfo', updated);
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
        var token = _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().getStorageSync('token');
        var userInfo = _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().getStorageSync('userInfo');
        if (token && userInfo) {
          set({
            token: token,
            userInfo: userInfo,
            isLoggedIn: true,
            currentRole: userInfo.role || 'guest'
          });
        }
      } catch (e) {
        console.error('恢复登录态失败', e);
      }
    }
  };
});

/***/ })

}]);
//# sourceMappingURL=common.js.map