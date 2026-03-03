"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/users/profile/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/users/profile/index!./src/pages/users/profile/index.tsx":
/*!********************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/users/profile/index!./src/pages/users/profile/index.tsx ***!
  \********************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ProfilePage; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var _utils_route_guard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/utils/route-guard */ "./src/utils/route-guard.ts");
/* harmony import */ var _components_TabBar_index__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/components/TabBar/index */ "./src/components/TabBar/index.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * 我的（个人中心）— 全角色共享 TabBar 页（槽位 4）
 *
 * @description 按角色显示差异化内容：
 * - Manager：个人设置、切换 Web 端入口
 * - Sales：个人业绩、设置
 * - Worker：收益结算（历史明细）、个人设置
 * - Customer：我的订单（含报修入口）、积分 & VIP、收货地址
 */







/** 菜单项定义 */

/** 全部菜单项 */
var MENU_ITEMS = [
// Worker 专属
{
  icon: '💰',
  label: '收益结算',
  path: '/pages/workbench-sub/engineer/index',
  roles: ['worker']
},
// Customer 专属
{
  icon: '📦',
  label: '我的订单',
  path: '/pages/orders/index',
  roles: ['customer']
}, {
  icon: '🔧',
  label: '报修服务',
  path: '/pages/service/list/index',
  roles: ['customer']
},
// Sales 专属
{
  icon: '🏆',
  label: '个人业绩',
  path: '/pages/reports/index',
  roles: ['sales']
},
// Manager 专属
{
  icon: '💻',
  label: '前往 Web 管理端',
  path: '/pages/landing/index',
  roles: ['manager', 'admin']
}, {
  icon: '🎯',
  label: '销售目标',
  path: '/pages/manager/targets/index',
  roles: ['manager', 'admin']
},
// 全角色
{
  icon: '✏️',
  label: '编辑资料',
  path: '/pages/users/edit/index'
}, {
  icon: '👥',
  label: '邀请同事',
  path: '/pages/invite/index',
  roles: ['manager', 'admin', 'sales']
}, {
  icon: '⚙️',
  label: '租户设置',
  path: '/pages/tenant/payment-settings/index',
  roles: ['manager', 'admin']
}];
function ProfilePage() {
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useLoad)(function () {
    (0,_utils_route_guard__WEBPACK_IMPORTED_MODULE_3__.requireAuth)();
  });
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_2__.useAuthStore)(),
    userInfo = _useAuthStore.userInfo,
    currentRole = _useAuthStore.currentRole,
    logout = _useAuthStore.logout;

  /** 过滤出当前角色可见的菜单 */
  var visibleMenus = MENU_ITEMS.filter(function (item) {
    return !item.roles || item.roles.includes(currentRole);
  });
  var roleLabel = {
    manager: '管理员',
    admin: '超级管理员',
    sales: '销售顾问',
    worker: '安装工/测量师',
    customer: '客户',
    guest: '游客'
  };

  /** 退出登录 */
  var handleLogout = function handleLogout() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      confirmText: '退出',
      confirmColor: '#F56C6C',
      success: function success(res) {
        if (res.confirm) {
          logout();
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().reLaunch({
            url: '/pages/login/index'
          });
        }
      }
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
    className: "profile-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "profile-card",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "avatar-wrap",
        children: userInfo !== null && userInfo !== void 0 && userInfo.avatarUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Image, {
          className: "avatar",
          src: userInfo.avatarUrl,
          mode: "aspectFill"
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
          className: "avatar avatar--default",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            children: ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) || '?')[0]
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "profile-info",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          className: "profile-name",
          children: (userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) || '未登录'
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          className: "profile-role",
          children: roleLabel[currentRole] || currentRole
        }), (userInfo === null || userInfo === void 0 ? void 0 : userInfo.tenantName) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          className: "profile-tenant",
          children: userInfo.tenantName
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "menu-section",
      children: visibleMenus.map(function (item) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
          className: "menu-item",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
              url: item.path
            });
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "menu-icon",
            children: item.icon
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "menu-label",
            children: item.label
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "menu-arrow",
            children: "\u203A"
          })]
        }, item.path);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "logout-section",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "logout-btn",
        onClick: handleLogout,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          children: "\u9000\u51FA\u767B\u5F55"
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_components_TabBar_index__WEBPACK_IMPORTED_MODULE_4__["default"], {
      selected: "/pages/users/profile/index"
    })]
  });
}

/***/ }),

/***/ "./src/pages/users/profile/index.tsx":
/*!*******************************************!*\
  !*** ./src/pages/users/profile/index.tsx ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_users_profile_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/users/profile/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/users/profile/index!./src/pages/users/profile/index.tsx");


var config = {"navigationBarTitleText":"我的"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_users_profile_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/users/profile/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_users_profile_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_users_profile_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_users_profile_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_users_profile_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/users/profile/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map