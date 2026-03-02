"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/quotes/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/index!./src/pages/quotes/index.tsx":
/*!******************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/index!./src/pages/quotes/index.tsx ***!
  \******************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ QuotesPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);




/**
 * 报价单列表页
 */






var STATUS_COLOR = {
  draft: '#909399',
  sent: '#409EFF',
  confirmed: '#67C23A',
  expired: '#F56C6C'
};
function QuotesPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    keyword = _useState2[0],
    setKeyword = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)([]),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    list = _useState4[0],
    setList = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(true),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    hasMore = _useState6[0],
    setHasMore = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    loading = _useState8[0],
    setLoading = _useState8[1];
  var pageRef = (0,react__WEBPACK_IMPORTED_MODULE_6__.useRef)(1);
  var fetchList = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var reset,
        kw,
        currentPage,
        res,
        _res$data,
        items,
        pagination,
        newList,
        _args = arguments;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            reset = _args.length > 0 && _args[0] !== undefined ? _args[0] : false;
            kw = _args.length > 1 && _args[1] !== undefined ? _args[1] : keyword;
            if (!loading) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            currentPage = reset ? 1 : pageRef.current;
            setLoading(true);
            _context.p = 2;
            _context.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_7__.api.get('/quotes', {
              data: {
                page: currentPage,
                pageSize: 20,
                keyword: kw
              }
            });
          case 3:
            res = _context.v;
            if (res.success) {
              _res$data = res.data, items = _res$data.items, pagination = _res$data.pagination;
              newList = reset ? items : [].concat((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(list), (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(items));
              setList(newList);
              pageRef.current = currentPage + 1;
              setHasMore(newList.length < pagination.total);
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
    return function fetchList() {
      return _ref.apply(this, arguments);
    };
  }();
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useDidShow)(function () {
    fetchList(true);
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.usePullDownRefresh)(function () {
    fetchList(true).then(function () {
      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().stopPullDownRefresh();
    });
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useReachBottom)(function () {
    if (hasMore && !loading) fetchList();
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "quotes-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "page-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "page-title",
        children: "\u62A5\u4EF7\u5355"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "header-actions",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "btn-create",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
              url: '/pages/quotes/create/index'
            });
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            children: "+ \u65B0\u5EFA"
          })
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "search-bar",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Input, {
        className: "search-input",
        placeholder: "\u641C\u7D22\u5BA2\u6237\u540D/\u62A5\u4EF7\u5355\u53F7",
        value: keyword,
        onInput: function onInput(e) {
          return setKeyword(e.detail.value);
        },
        onConfirm: function onConfirm() {
          return fetchList(true);
        }
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      className: "list-scroll",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: [list.length === 0 && !loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "empty flex-center",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-icon",
          children: "\uD83D\uDCC4"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-text",
          children: "\u6682\u65E0\u62A5\u4EF7\u5355"
        })]
      }), list.map(function (q) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "quote-card card",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
              url: "/pages/quotes/detail/index?id=".concat(q.id)
            });
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "card-row card-row--between",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "quote-no",
              children: q.quoteNo
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              style: {
                color: STATUS_COLOR[q.status] || '#909399',
                fontSize: '24px'
              },
              children: q.statusText
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "quote-customer",
            children: q.customerName
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "card-row card-row--between",
            style: {
              marginTop: '8px'
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "quote-rooms",
              children: [q.roomCount, " \u4E2A\u623F\u95F4"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "quote-amount",
              children: ["\xA5", q.totalAmount.toLocaleString()]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "quote-date",
            children: q.createdAt
          })]
        }, q.id);
      }), loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "loading flex-center",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          children: "\u52A0\u8F7D\u4E2D..."
        })
      }), !hasMore && list.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "no-more flex-center",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          children: "\u2014 \u5DF2\u663E\u793A\u5168\u90E8 \u2014"
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/quotes/index.tsx":
/*!************************************!*\
  !*** ./src/pages/quotes/index.tsx ***!
  \************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/index!./src/pages/quotes/index.tsx");


var config = {"navigationBarTitleText":"quotes"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/quotes/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/quotes/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map