"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/landing/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/index!./src/pages/landing/index.tsx":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/index!./src/pages/landing/index.tsx ***!
  \********************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LandingPage; }
/* harmony export */ });
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var _stores_tenant_landing__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/stores/tenant-landing */ "./src/stores/tenant-landing.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * 引导/落地页 — 「两张脸」动态模式
 *
 * @description 根据启动参数自动切换：
 * - 无 tenantCode → L2C 官方推广页（吸引行业内注册）
 * - 有 tenantCode → 租户品牌专属落地页（商家获客工具，L2C 隐形）
 *
 * 参数传递：
 * - 分享卡片：path 携带 ?tc=CODE
 * - 小程序码：scene 携带 tc=CODE
 */







function LandingPage() {
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_3__.useAuthStore)(),
    isLoggedIn = _useAuthStore.isLoggedIn,
    currentRole = _useAuthStore.currentRole;
  var _useTenantLandingStor = (0,_stores_tenant_landing__WEBPACK_IMPORTED_MODULE_4__.useTenantLandingStore)(),
    profile = _useTenantLandingStor.profile,
    loading = _useTenantLandingStor.loading,
    fetchProfile = _useTenantLandingStor.fetchProfile,
    tenantCode = _useTenantLandingStor.tenantCode;
  /** 是否为租户模式（有有效的租户公开信息） */
  var isTenantMode = !!profile && !!tenantCode;

  /**
   * 解析启动参数，提取 tenantCode
   * - 分享卡片：options.tc
   * - 小程序码扫码：options.scene（需 decodeURIComponent 解析）
   */
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useLoad)(function (options) {
    var code = (options === null || options === void 0 ? void 0 : options.tc) || '';

    // 小程序码的 scene 参数解析（格式：tc=CODE）
    if (!code && options !== null && options !== void 0 && options.scene) {
      var decoded = decodeURIComponent(options.scene);
      var match = decoded.match(/tc=([^&]+)/);
      if (match) {
        code = match[1];
      }
    }
    if (code) {
      fetchProfile(code);
    }
  });

  // 配置分享功能（仅租户模式下生效）
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_1__.useShareAppMessage)(function () {
    if (isTenantMode && profile) {
      return {
        title: "".concat(profile.name).concat(profile.slogan ? ' — ' + profile.slogan : ''),
        path: "/pages/landing/index?tc=".concat(tenantCode),
        imageUrl: profile.landingCoverUrl || profile.logoUrl || ''
      };
    }
    return {
      title: 'L2C 窗帘全流程管理大师',
      path: '/pages/landing/index'
    };
  });

  // ========== 导航方法 ==========
  var goLogin = function goLogin() {
    return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: '/pages/login/index'
    });
  };
  var goRegister = function goRegister() {
    return _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: '/pages/register/index'
    });
  };

  /** 复制 Web 管理端链接 */
  var openWebAdmin = function openWebAdmin() {
    var ADMIN_URL = process.env.TARO_APP_WEB_URL || 'https://l2c.example.com';
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().setClipboardData({
      data: ADMIN_URL
    }).then(function () {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().showToast({
        title: 'Web 端链接已复制',
        icon: 'success'
      });
    });
  };

  /** 一键拨打电话 */
  var callPhone = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(function () {
    if (profile !== null && profile !== void 0 && profile.phone) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().makePhoneCall({
        phoneNumber: profile.phone
      });
    }
  }, [profile === null || profile === void 0 ? void 0 : profile.phone]);

  /** 预约上门 — 跳转到预约表单页 */
  var goBooking = (0,react__WEBPACK_IMPORTED_MODULE_2__.useCallback)(function () {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_1___default().navigateTo({
      url: "/pages/landing/booking/index?tc=".concat(tenantCode)
    });
  }, [tenantCode]);

  // ========== 加载中骨架屏 ==========
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "landing-page landing-loading",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "skeleton-circle"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "skeleton-line skeleton-title"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "skeleton-line skeleton-subtitle"
      })]
    });
  }

  // ========== 租户品牌落地页 ==========
  if (isTenantMode && profile) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "landing-page tenant-landing",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "tenant-hero",
        style: profile.landingCoverUrl ? {
          backgroundImage: "url(".concat(profile.landingCoverUrl, ")")
        } : undefined,
        children: [profile.logoUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Image, {
          className: "tenant-logo",
          src: profile.logoUrl,
          mode: "aspectFit"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          className: "tenant-name",
          children: profile.name
        }), profile.slogan && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          className: "tenant-slogan",
          children: profile.slogan
        })]
      }), (profile.detailAddress || profile.region || profile.phone) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "tenant-info card",
        children: [(profile.detailAddress || profile.region) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "info-icon",
            children: "\uD83D\uDCCD"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "info-text",
            children: [profile.region, profile.detailAddress ? " ".concat(profile.detailAddress) : '']
          })]
        }), profile.phone && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
          className: "info-row",
          onClick: callPhone,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "info-icon",
            children: "\uD83D\uDCDE"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "info-text info-phone",
            children: profile.phone
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
        className: "tenant-actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          className: "btn-primary",
          onClick: goBooking,
          children: "\uD83D\uDCD0 \u9884\u7EA6\u4E0A\u95E8\u91CF\u7A97"
        }), profile.phone && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          className: "btn-call",
          onClick: callPhone,
          children: "\uD83D\uDCDE \u7ACB\u5373\u62E8\u6253"
        }), profile.contactWechat && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          className: "btn-wechat",
          openType: "contact",
          children: "\uD83D\uDCAC \u5FAE\u4FE1\u8054\u7CFB\u9500\u552E"
        })]
      })]
    });
  }

  // ========== L2C 官方推广页（默认） ==========
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
    className: "landing-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "landing-hero",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
        className: "hero-logo",
        children: "L2C"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
        className: "hero-title",
        children: "\u7A97\u5E18\u5168\u6D41\u7A0B\u7BA1\u7406\u5927\u5E08"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
        className: "hero-desc",
        children: "\u4ECE\u7EBF\u7D22\u5230\u5B89\u88C5\uFF0C\u5168\u94FE\u8DEF\u6570\u5B57\u5316\u7BA1\u7406"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "landing-actions",
      children: !isLoggedIn ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          className: "btn-primary",
          onClick: goLogin,
          children: "\u7ACB\u5373\u767B\u5F55"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          className: "btn-secondary",
          onClick: goRegister,
          children: "\u7533\u8BF7\u5165\u9A7B"
        })]
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
          className: "already-login",
          children: ["\u5DF2\u767B\u5F55\u4E3A ", currentRole]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
          className: "btn-secondary",
          onClick: openWebAdmin,
          children: "\uD83D\uDCBB \u590D\u5236 Web \u7BA1\u7406\u7AEF\u94FE\u63A5"
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
      className: "features",
      children: [{
        icon: '📋',
        title: '线索管理',
        desc: '录入、分配、跟进全流程'
      }, {
        icon: '📄',
        title: '快速报价',
        desc: '按房间和产品自动计算'
      }, {
        icon: '📐',
        title: '量尺调度',
        desc: '工人接单，客户实时确认'
      }, {
        icon: '🏠',
        title: '云展厅',
        desc: '一键分享产品给客户浏览'
      }].map(function (f) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
          className: "feature-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.View, {
            className: "feature-icon-wrap",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
              className: "feature-icon",
              children: f.icon
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "feature-title",
            children: f.title
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_0__.Text, {
            className: "feature-desc",
            children: f.desc
          })]
        }, f.title);
      })
    })]
  });
}

/***/ }),

/***/ "./src/pages/landing/index.tsx":
/*!*************************************!*\
  !*** ./src/pages/landing/index.tsx ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/landing/index!./src/pages/landing/index.tsx");


var config = {"navigationBarTitleText":"欢迎使用","navigationBarBackgroundColor":"#F5F5F7","navigationBarTextStyle":"black"};

_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].enableShareAppMessage = true

var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/landing/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_landing_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ }),

/***/ "./src/stores/tenant-landing.ts":
/*!**************************************!*\
  !*** ./src/stores/tenant-landing.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useTenantLandingStore: function() { return /* binding */ useTenantLandingStore; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! zustand */ "webpack/container/remote/zustand");
/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(zustand__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");


/**
 * 租户落地页状态管理 (Zustand)
 *
 * @description 管理小程序落地页的租户信息状态。
 * 当用户通过分享链接或扫码进入时，解析 tenantCode 并获取租户公开信息。
 */



/** 租户公开信息（与后端 TenantPublicProfile 对应） */

/** 落地页状态接口 */

/**
 * 租户落地页 Store
 *
 * @example
 * ```tsx
 * const { profile, loading, fetchProfile } = useTenantLandingStore()
 * useEffect(() => { fetchProfile('SHANGJIA88') }, [])
 * ```
 */
var useTenantLandingStore = (0,zustand__WEBPACK_IMPORTED_MODULE_2__.create)(function (set) {
  return {
    tenantCode: null,
    profile: null,
    loading: false,
    error: null,
    fetchProfile: function () {
      var _fetchProfile = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(code) {
        var res, _t;
        return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              set({
                tenantCode: code,
                loading: true,
                error: null
              });
              _context.p = 1;
              _context.n = 2;
              return _services_api__WEBPACK_IMPORTED_MODULE_3__.api.get("/miniprogram/tenant/public-profile?code=".concat(encodeURIComponent(code)));
            case 2:
              res = _context.v;
              if (res.success && res.data) {
                set({
                  profile: res.data,
                  loading: false
                });
              } else {
                // 查询失败，降级为 L2C 官方页面
                set({
                  profile: null,
                  tenantCode: null,
                  loading: false,
                  error: res.error || '未找到商家'
                });
              }
              _context.n = 4;
              break;
            case 3:
              _context.p = 3;
              _t = _context.v;
              set({
                profile: null,
                tenantCode: null,
                loading: false,
                error: '网络请求失败'
              });
            case 4:
              return _context.a(2);
          }
        }, _callee, null, [[1, 3]]);
      }));
      function fetchProfile(_x) {
        return _fetchProfile.apply(this, arguments);
      }
      return fetchProfile;
    }(),
    reset: function reset() {
      set({
        tenantCode: null,
        profile: null,
        loading: false,
        error: null
      });
    }
  };
});

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/landing/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map