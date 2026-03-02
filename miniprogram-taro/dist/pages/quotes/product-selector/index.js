"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/quotes/product-selector/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/product-selector/index!./src/pages/quotes/product-selector/index.tsx":
/*!****************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/product-selector/index!./src/pages/quotes/product-selector/index.tsx ***!
  \****************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ ProductSelectorPage; }
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
 * 商品选择器页（报价创建流程中使用）
 */






function ProductSelectorPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    quoteId = _useState2[0],
    setQuoteId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)([]),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    products = _useState4[0],
    setProducts = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(new Set()),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    selected = _useState6[0],
    setSelected = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    keyword = _useState8[0],
    setKeyword = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState9, 2),
    loading = _useState0[0],
    setLoading = _useState0[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(/*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(params) {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setQuoteId(params.quoteId || '');
            _context.p = 1;
            _context.n = 2;
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.get('/products', {
              data: {
                pageSize: 100
              }
            });
          case 2:
            res = _context.v;
            if (res.success) setProducts(res.data.items || []);
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
  var toggleProduct = function toggleProduct(id) {
    setSelected(function (prev) {
      var next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };
  var confirmSelection = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!(selected.size === 0)) {
              _context2.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '请至少选择一个商品',
              icon: 'none'
            });
            return _context2.a(2);
          case 1:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
              title: '添加中...'
            });
            _context2.p = 2;
            _context2.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.post("/quotes/".concat(quoteId, "/items"), {
              data: {
                productIds: Array.from(selected)
              }
            });
          case 3:
            res = _context2.v;
            if (res.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                title: '添加成功',
                icon: 'success'
              });
              setTimeout(function () {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack();
              }, 1500);
            }
          case 4:
            _context2.p = 4;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
            return _context2.f(4);
          case 5:
            return _context2.a(2);
        }
      }, _callee2, null, [[2,, 4, 5]]);
    }));
    return function confirmSelection() {
      return _ref2.apply(this, arguments);
    };
  }();
  var filtered = keyword ? products.filter(function (p) {
    return p.name.includes(keyword) || p.category.includes(keyword);
  }) : products;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "selector-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "search-bar",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Input, {
        className: "search-input",
        placeholder: "\u641C\u7D22\u5546\u54C1",
        value: keyword,
        onInput: function onInput(e) {
          return setKeyword(e.detail.value);
        }
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      className: "product-list",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: filtered.map(function (p) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "product-card card ".concat(selected.has(p.id) ? 'product-card--selected' : ''),
          onClick: function onClick() {
            return toggleProduct(p.id);
          },
          children: [p.image && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Image, {
            className: "product-img",
            src: p.image,
            mode: "aspectFill"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "product-info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "product-name",
              children: p.name
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "product-category",
              children: p.category
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "product-price",
              children: ["\xA5", p.price, "/", p.unit]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "check-mark",
            children: selected.has(p.id) ? '✅' : '⬜'
          })]
        }, p.id);
      })
    }), selected.size > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "confirm-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "selected-count",
        children: ["\u5DF2\u9009 ", selected.size, " \u4EF6"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "btn-confirm",
        onClick: confirmSelection,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u786E\u8BA4\u6DFB\u52A0"
        })
      })]
    })]
  });
}

/***/ }),

/***/ "./src/pages/quotes/product-selector/index.tsx":
/*!*****************************************************!*\
  !*** ./src/pages/quotes/product-selector/index.tsx ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_product_selector_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/product-selector/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/product-selector/index!./src/pages/quotes/product-selector/index.tsx");


var config = {"navigationBarTitleText":"product-selector"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_product_selector_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/quotes/product-selector/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_product_selector_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_product_selector_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_product_selector_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_product_selector_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/quotes/product-selector/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map