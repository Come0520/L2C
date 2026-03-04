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
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var _stores_tenant_landing__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/stores/tenant-landing */ "./src/stores/tenant-landing.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);


/**
 * 引导/落地页 — 「两张脸」动态模式
 *
 * @description 根据启动参数和登录状态自动切换：
 *
 * 情况 1：有 tc 参数 + 租户为 Pro/Enterprise
 *   → 租户品牌专属落地页（商家获客工具，L2C 隐形）
 *
 * 情况 2：有 tc 参数 + 租户为 Base（或已过期/查不到）
 *   → 降级为 L2C 官方推广页
 *
 * 情况 3：无 tc 参数 + 用户已登录（Token 有效）
 *   → 自动静默跳转到角色对应首页，用户无感知
 *
 * 情况 4：无 tc 参数 + 用户未登录
 *   → L2C 官方推广页（含登录、申请入驻入口）
 *
 * 参数传递：
 * - 分享卡片：path 携带 ?tc=CODE
 * - 小程序码：scene 携带 tc=CODE
 */







/**
 * ⚠️ 开发调试开关 — 上线前改为 false 即可隐藏角色切换面板
 */

var __DEV_ROLE_SWITCHER__ = true;

/** 调试用：四大角色快速入口配置 */
var DEV_ROLES = [{
  role: 'manager',
  label: '管理员',
  icon: '👔',
  desc: '审批 · 报表 · 全局管控',
  color: '#007AFF'
}, {
  role: 'sales',
  label: '销售顾问',
  icon: '💼',
  desc: '线索 · 报价 · 展厅 · 客户',
  color: '#34C759'
}, {
  role: 'worker',
  label: '安装工人',
  icon: '🔧',
  desc: '任务 · 量尺 · 进度反馈',
  color: '#FF9500'
}, {
  role: 'customer',
  label: '终端客户',
  icon: '🏠',
  desc: '展厅浏览 · 方案确认',
  color: '#AF52DE'
}];
function LandingPage() {
  var _authState$userInfo;
  var _useTenantLandingStor = (0,_stores_tenant_landing__WEBPACK_IMPORTED_MODULE_6__.useTenantLandingStore)(),
    profile = _useTenantLandingStor.profile,
    loading = _useTenantLandingStor.loading,
    fetchProfile = _useTenantLandingStor.fetchProfile,
    tenantCode = _useTenantLandingStor.tenantCode;

  /**
   * 是否显示租户品牌页：
   * 必须同时满足：有 tc 参数 + 有租户数据 + 套餐为 pro 或 enterprise
   */
  var isBrandMode = !!profile && !!tenantCode && (profile.planType === 'pro' || profile.planType === 'enterprise');

  /**
   * 解析启动参数，提取 tenantCode
   * 同时处理已登录用户的自动跳转
   */
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_3__.useLoad)(/*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(options) {
      var code, decoded, match, authState, _authState$currentRol, roleKey, home, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            code = (options === null || options === void 0 ? void 0 : options.tc) || ''; // 小程序码的 scene 参数解析（格式：tc=CODE）
            if (!code && options !== null && options !== void 0 && options.scene) {
              decoded = decodeURIComponent(options.scene);
              match = decoded.match(/tc=([^&]+)/);
              if (match) {
                code = match[1];
              }
            }
            if (!code) {
              _context.n = 1;
              break;
            }
            // 有租户码：拉取租户信息，根据 planType 决定显示模式
            fetchProfile(code);
            return _context.a(2);
          case 1:
            if (!__DEV_ROLE_SWITCHER__) {
              _context.n = 2;
              break;
            }
            return _context.a(2);
          case 2:
            authState = _stores_auth__WEBPACK_IMPORTED_MODULE_5__.useAuthStore.getState();
            if (!(authState.isLoggedIn && authState.currentRole !== 'guest')) {
              _context.n = 6;
              break;
            }
            roleKey = ((_authState$currentRol = authState.currentRole) === null || _authState$currentRol === void 0 ? void 0 : _authState$currentRol.toLowerCase()) || 'guest';
            home = _stores_auth__WEBPACK_IMPORTED_MODULE_5__.ROLE_HOME[roleKey] || '/pages/workbench/index';
            _context.p = 3;
            _context.n = 4;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().switchTab({
              url: home
            });
          case 4:
            _context.n = 6;
            break;
          case 5:
            _context.p = 5;
            _t = _context.v;
            _context.n = 6;
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().reLaunch({
              url: home
            });
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[3, 5]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());

  // 配置分享功能（仅租户品牌模式下生效）
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_3__.useShareAppMessage)(function () {
    if (isBrandMode && profile) {
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
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().navigateTo({
      url: '/pages/login/index'
    });
  };
  var goRegister = function goRegister() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().navigateTo({
      url: '/pages/register/index'
    });
  };

  /** 一键拨打电话 */
  var callPhone = (0,react__WEBPACK_IMPORTED_MODULE_4__.useCallback)(function () {
    if (profile !== null && profile !== void 0 && profile.phone) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().makePhoneCall({
        phoneNumber: profile.phone
      });
    }
  }, [profile]);

  /** 预约上门 — 跳转到预约表单页 */
  var goBooking = (0,react__WEBPACK_IMPORTED_MODULE_4__.useCallback)(function () {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().navigateTo({
      url: "/pages/landing/booking/index?tc=".concat(tenantCode)
    });
  }, [tenantCode]);

  /**
   * 调试用：切换角色并跳转到该角色首页
   * 已登录时保留真实 token，只切换角色，API 调用不会 401
   * 未登录时提示先登录
   */
  var switchToRole = (0,react__WEBPACK_IMPORTED_MODULE_4__.useCallback)(function (role) {
    var store = _stores_auth__WEBPACK_IMPORTED_MODULE_5__.useAuthStore.getState();
    if (!store.isLoggedIn) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().showToast({
        title: '请先登录再切换角色',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 保留真实 token，只切换角色
    store.updateRole(role);
    var home = _stores_auth__WEBPACK_IMPORTED_MODULE_5__.ROLE_HOME[role] || '/pages/workbench/index';
    try {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().switchTab({
        url: home
      });
    } catch (_unused2) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_3___default().reLaunch({
        url: home
      });
    }
  }, []);

  // ========== 加载中骨架屏 ==========
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "landing-page landing-loading",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "skeleton-circle"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "skeleton-line skeleton-title"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "skeleton-line skeleton-subtitle"
      })]
    });
  }

  // ========== 租户品牌落地页（Pro/Enterprise 专属） ==========
  if (isBrandMode && profile) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "landing-page tenant-landing",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "tenant-hero",
        style: profile.landingCoverUrl ? {
          backgroundImage: "url(".concat(profile.landingCoverUrl, ")")
        } : undefined,
        children: [profile.logoUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Image, {
          className: "tenant-logo",
          src: profile.logoUrl,
          mode: "aspectFit"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "tenant-name",
          children: profile.name
        }), profile.slogan && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "tenant-slogan",
          children: profile.slogan
        })]
      }), (profile.detailAddress || profile.region || profile.phone) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "tenant-info card",
        children: [(profile.detailAddress || profile.region) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "info-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "info-icon",
            children: "\uD83D\uDCCD"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "info-text",
            children: [profile.region, profile.detailAddress ? " ".concat(profile.detailAddress) : '']
          })]
        }), profile.phone && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "info-row",
          onClick: callPhone,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "info-icon",
            children: "\uD83D\uDCDE"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "info-text info-phone",
            children: profile.phone
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "tenant-actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          className: "btn-primary",
          onClick: goBooking,
          children: "\uD83D\uDCD0 \u9884\u7EA6\u4E0A\u95E8\u91CF\u7A97"
        }), profile.phone && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          className: "btn-call",
          onClick: callPhone,
          children: "\uD83D\uDCDE \u7ACB\u5373\u62E8\u6253"
        }), profile.contactWechat && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          className: "btn-wechat",
          openType: "contact",
          children: "\uD83D\uDCAC \u5FAE\u4FE1\u8054\u7CFB\u9500\u552E"
        })]
      })]
    });
  }

  // 获取当前登录状态（用于调试面板提示）
  var authState = _stores_auth__WEBPACK_IMPORTED_MODULE_5__.useAuthStore.getState();

  // ========== L2C 官方推广页（默认/降级） ==========
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
    className: "landing-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "landing-hero",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "hero-logo",
        children: "L2C"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "hero-title",
        children: "\u7A97\u5E18\u5168\u6D41\u7A0B\u7BA1\u7406\u5927\u5E08"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
        className: "hero-desc",
        children: "\u4ECE\u7EBF\u7D22\u5230\u5B89\u88C5\uFF0C\u5168\u94FE\u8DEF\u6570\u5B57\u5316\u7BA1\u7406"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "landing-actions",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        className: "apple-btn-primary",
        onClick: goLogin,
        children: "\u7ACB\u5373\u767B\u5F55"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        style: {
          height: 16
        }
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        className: "apple-btn-secondary",
        onClick: goRegister,
        children: "\u7533\u8BF7\u5165\u9A7B"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
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
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
          className: "feature-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "feature-icon-wrap",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
              className: "feature-icon",
              children: f.icon
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "feature-title",
            children: f.title
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
            className: "feature-desc",
            children: f.desc
          })]
        }, f.title);
      })
    }), __DEV_ROLE_SWITCHER__ && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
      className: "dev-role-switcher",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "dev-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "dev-badge",
          children: "\uD83D\uDD27 DEV"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "dev-title",
          children: "\u89D2\u8272\u4F53\u9A8C\u5165\u53E3"
        }), authState.isLoggedIn ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "dev-hint dev-hint--ok",
          children: ["\u2705 \u5DF2\u767B\u5F55\uFF1A", (_authState$userInfo = authState.userInfo) === null || _authState$userInfo === void 0 ? void 0 : _authState$userInfo.name, " \u2014 \u70B9\u51FB\u5207\u6362\u89D2\u8272"]
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
          className: "dev-hint dev-hint--warn",
          children: "\u26A0\uFE0F \u8BF7\u5148\u70B9\u51FB\u4E0A\u65B9\u300C\u7ACB\u5373\u767B\u5F55\u300D\uFF0C\u518D\u56DE\u6765\u5207\u6362\u89D2\u8272"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
        className: "dev-roles",
        children: DEV_ROLES.map(function (item) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
            className: "dev-role-card ".concat(!authState.isLoggedIn ? 'dev-role-card--disabled' : ''),
            style: {
              borderLeftColor: item.color
            },
            onClick: function onClick() {
              return switchToRole(item.role);
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
              className: "dev-role-icon",
              children: item.icon
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.View, {
              className: "dev-role-info",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
                className: "dev-role-label",
                children: item.label
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
                className: "dev-role-desc",
                children: item.desc
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_2__.Text, {
              className: "dev-role-arrow",
              children: "\u203A"
            })]
          }, item.role);
        })
      })]
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