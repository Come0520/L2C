"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageShowroom/article-detail/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageShowroom/article-detail/index!./src/packageShowroom/article-detail/index.tsx":
/*!******************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageShowroom/article-detail/index!./src/packageShowroom/article-detail/index.tsx ***!
  \******************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ArticleDetailPage; }
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
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);










/** 文章详情模型 */

function ArticleDetailPage() {
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_7__.useAuthStore)(),
    currentRole = _useAuthStore.currentRole;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(null),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    item = _useState2[0],
    setItem = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    isFavorite = _useState6[0],
    setIsFavorite = _useState6[1];
  var isSales = currentRole === 'sales';
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(/*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(params) {
      var id, res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            id = params.id;
            if (id) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            _context.p = 1;
            _context.n = 2;
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.get("/showroom/articles/".concat(id)).catch(function () {
              return {
                success: true,
                data: {}
              };
            });
          case 2:
            res = _context.v;
            if (res.success) {
              setItem({
                id: id,
                title: res.data.title || '春季装修避坑指南：这些地方千万别乱省钱！',
                coverUrl: res.data.coverUrl || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop',
                author: res.data.author || 'L2C 装修研究所',
                publishTime: res.data.publishTime || '2025-03-01 10:00',
                viewCount: res.data.viewCount || 1284,
                content: res.data.content || "\n            <div style=\"font-size: 14px; color: #333; line-height: 1.8;\">\n              <p>\u88C5\u4FEE\u662F\u4E00\u4EF6\u8D39\u52B2\u5FC3\u529B\u7684\u4E8B\u60C5\uFF0C\u5F88\u591A\u4EBA\u4E3A\u4E86\u7701\u94B1\uFF0C\u5728\u4E00\u4E9B\u9690\u853D\u5DE5\u7A0B\u6216\u8005\u4E94\u91D1\u914D\u4EF6\u4E0A\u62A0\u95E8\uFF0C\u7ED3\u679C\u4F4F\u8FDB\u53BB\u6CA1\u591A\u4E45\u5C31\u82E6\u4E0D\u582A\u8A00\u3002\u4ECA\u5929\u6211\u4EEC\u5C31\u6765\u76D8\u70B9\u4E00\u4E0B\uFF0C\u88C5\u4FEE\u4E2D\u54EA\u4E9B\u5730\u65B9\u662F<strong>\u575A\u51B3\u4E0D\u80FD\u7701\u94B1</strong>\u7684\u3002</p>\n              <h3 style=\"color: #000; font-size: 16px; margin: 20px 0 10px;\">1. \u6C34\u7535\u6750\u6599</h3>\n              <p>\u6C34\u7535\u662F\u9690\u853D\u5DE5\u7A0B\uFF0C\u4E00\u65E6\u5C01\u5728\u5899\u91CC\uFF0C\u4E00\u65E6\u51FA\u95EE\u9898\uFF0C\u7EF4\u4FEE\u6210\u672C\u6210\u500D\u589E\u52A0\u3002\u7535\u7EBF\u3001\u6C34\u7BA1\u3001\u7A7F\u7EBF\u7BA1\u5FC5\u987B\u7528\u5927\u724C\uFF0C\u4E0D\u8981\u8D2A\u56FE\u4FBF\u5B9C\u3002</p>\n              <h3 style=\"color: #000; font-size: 16px; margin: 20px 0 10px;\">2. \u536B\u751F\u95F4\u9632\u6C34</h3>\n              <p>\u9632\u6C34\u505A\u4E0D\u597D\uFF0C\u697C\u4E0B\u90BB\u5C45\u5929\u5929\u627E\u3002\u9632\u6C34\u6D82\u6599\u8981\u4E70\u597D\u7684\uFF0C\u6D82\u5237\u5DE5\u827A\u8981\u6309\u6807\u51C6\u6267\u884C\uFF0C\u5E76\u4E14\u4E00\u5B9A\u8981\u505A<strong>\u95ED\u6C34\u8BD5\u9A8C</strong>\u3002</p>\n              <img src=\"https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400\" style=\"max-width: 100%; border-radius: 8px; margin: 10px 0;\" />\n              <p>\u603B\u800C\u8A00\u4E4B\uFF0C\u88C5\u4FEE\u53EF\u4EE5\u7701\uFF0C\u4F46\u8BE5\u82B1\u7684\u5730\u65B9\u4E00\u5206\u4E5F\u4E0D\u80FD\u5C11\u3002</p>\n            </div>\n          "
              });
            }
          case 3:
            _context.p = 3;
            setLoading(false);
            return _context.f(3);
          case 4:
            return _context.a(2);
        }
      }, _callee, null, [[1,, 3, 4]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
  var toggleFavorite = function toggleFavorite() {
    setIsFavorite(!isFavorite);
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
      title: !isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  };
  var handleShare = function handleShare() {
    if (!item) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateTo({
      url: "/packageShowroom/capsule/index?id=".concat(item.id, "&mode=share&type=article")
    });
  };
  if (loading) return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "page flex-center",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
      children: "\u6B63\u5728\u52A0\u8F7D\u6587\u7AE0..."
    })
  });
  if (!item) return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "page empty-state flex-center",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
      children: "\u6587\u7AE0\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664"
    })
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "article-detail-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      className: "detail-scroll",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "article-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "article-title",
          children: item.title
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "article-meta",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "meta-item",
            children: item.author
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "meta-item",
            children: item.publishTime
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "meta-item",
            children: [item.viewCount, " \u9605\u8BFB"]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "article-body",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.RichText, {
          nodes: item.content
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "bottom-action-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "action-left",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "action-icon-btn",
          onClick: toggleFavorite,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "icon ".concat(isFavorite ? 'favorite-active' : ''),
            children: isFavorite ? '★' : '☆'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: isFavorite ? '已收藏' : '收藏'
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "action-right",
        children: isSales && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
          className: "btn btn-share",
          onClick: handleShare,
          children: "\u914D\u7F6E\u6743\u9650\u5E76\u5206\u4EAB"
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/packageShowroom/article-detail/index.tsx":
/*!******************************************************!*\
  !*** ./src/packageShowroom/article-detail/index.tsx ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageShowroom_article_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageShowroom/article-detail/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageShowroom/article-detail/index!./src/packageShowroom/article-detail/index.tsx");


var config = {"navigationBarTitleText":"文章详情","navigationBarBackgroundColor":"#FFFFFF","navigationBarTextStyle":"black"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageShowroom_article_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageShowroom/article-detail/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageShowroom_article_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageShowroom_article_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageShowroom_article_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageShowroom_article_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/packageShowroom/article-detail/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map