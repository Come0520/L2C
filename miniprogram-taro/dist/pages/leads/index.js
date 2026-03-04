"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/leads/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/leads/index!./src/pages/leads/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/leads/index!./src/pages/leads/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LeadsPage; }
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
/* harmony import */ var _utils_route_guard__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/utils/route-guard */ "./src/utils/route-guard.ts");
/* harmony import */ var _components_TabBar_index__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @/components/TabBar/index */ "./src/components/TabBar/index.tsx");
/* harmony import */ var _components_Skeleton_index__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @/components/Skeleton/index */ "./src/components/Skeleton/index.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__);




/**
 * 线索列表页（Sales 核心页，TabBar 槽位1）
 *
 * @description 从原生 leads/index.ts 迁移重写为 React 函数组件。
 * 两个 Tab：我的线索 / 公共线索池
 */









var STATUS_COLOR = {
  new: '#E6B450',
  following: '#409EFF',
  quoted: '#67C23A',
  lost: '#909399'
};
function LeadsPage() {
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useLoad)(function () {
    (0,_utils_route_guard__WEBPACK_IMPORTED_MODULE_8__.requireRole)(['sales', 'manager', 'admin']);
  });
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)('mine'),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(''),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    keyword = _useState4[0],
    setKeyword = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)([]),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    list = _useState6[0],
    setList = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(true),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    hasMore = _useState8[0],
    setHasMore = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState9, 2),
    loading = _useState0[0],
    setLoading = _useState0[1];
  var pageRef = (0,react__WEBPACK_IMPORTED_MODULE_6__.useRef)(1);
  var PAGE_SIZE = 20;

  /** 获取列表 */
  var fetchList = (0,react__WEBPACK_IMPORTED_MODULE_6__.useCallback)(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
    var reset,
      kw,
      tab,
      currentPage,
      res,
      _res$data,
      items,
      pagination,
      newList,
      _args = arguments,
      _t;
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          reset = _args.length > 0 && _args[0] !== undefined ? _args[0] : false;
          kw = _args.length > 1 && _args[1] !== undefined ? _args[1] : keyword;
          tab = _args.length > 2 && _args[2] !== undefined ? _args[2] : activeTab;
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
          return _services_api__WEBPACK_IMPORTED_MODULE_7__.api.get('/leads', {
            data: {
              type: tab,
              page: currentPage,
              pageSize: PAGE_SIZE,
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
          _context.n = 5;
          break;
        case 4:
          _context.p = 4;
          _t = _context.v;
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
            title: '加载失败',
            icon: 'none'
          });
        case 5:
          _context.p = 5;
          setLoading(false);
          return _context.f(5);
        case 6:
          return _context.a(2);
      }
    }, _callee, null, [[2, 4, 5, 6]]);
  })), [loading, list, keyword, activeTab]);
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
  var handleTabChange = function handleTabChange(tab) {
    setActiveTab(tab);
    setList([]);
    setHasMore(true);
    pageRef.current = 1;
    fetchList(true, keyword, tab);
  };
  var handleSearch = function handleSearch() {
    fetchList(true);
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "leads-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "search-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Input, {
        className: "search-input",
        placeholder: "\u641C\u7D22\u5BA2\u6237\u59D3\u540D/\u624B\u673A\u53F7",
        value: keyword,
        onInput: function onInput(e) {
          return setKeyword(e.detail.value);
        },
        onConfirm: handleSearch
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "search-btn",
        onClick: handleSearch,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          children: "\u641C\u7D22"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "leads-tabs",
      children: ['mine', 'pool'].map(function (tab) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "leads-tab ".concat(activeTab === tab ? 'leads-tab--active' : ''),
          onClick: function onClick() {
            return handleTabChange(tab);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            children: tab === 'mine' ? '我的线索' : '线索池'
          })
        }, tab);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      className: "leads-list",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: [list.length === 0 && !loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "empty flex-center",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-icon",
          children: "\uD83D\uDCCB"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-text",
          children: "\u6682\u65E0\u7EBF\u7D22"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_Skeleton_index__WEBPACK_IMPORTED_MODULE_10__.Skeleton, {
        loading: loading && list.length === 0,
        type: "list",
        rows: 5,
        avatar: true,
        children: list.map(function (lead) {
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "lead-card card",
            onClick: function onClick() {
              return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
                url: "/packageSales/lead-detail/index?id=".concat(lead.id)
              });
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "card-row card-row--between",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "lead-name",
                children: lead.customerName
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "lead-status",
                style: {
                  color: STATUS_COLOR[lead.status] || '#909399'
                },
                children: lead.statusText
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "lead-phone",
              children: lead.phone
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "card-row card-row--between",
              style: {
                marginTop: '8px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "lead-source",
                children: lead.source
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "lead-time",
                children: lead.createdAt
              })]
            }), lead.lastFollowUp && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "lead-followup",
              children: ["\u6700\u8FD1\u8DDF\u8FDB\uFF1A", lead.lastFollowUp]
            })]
          }, lead.id);
        })
      }), loading && list.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "loading flex-center",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          children: "\u52A0\u8F7D\u4E2D..."
        })
      }), !hasMore && list.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "no-more flex-center",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          children: "\u2014 \u5DF2\u663E\u793A\u5168\u90E8 \u2014"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_TabBar_index__WEBPACK_IMPORTED_MODULE_9__["default"], {
      selected: "/pages/leads/index"
    })]
  });
}

/***/ }),

/***/ "./src/pages/leads/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/leads/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_leads_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/leads/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/leads/index!./src/pages/leads/index.tsx");


var config = {"navigationBarTitleText":"leads"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_leads_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/leads/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_leads_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_leads_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_leads_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_leads_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/leads/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map