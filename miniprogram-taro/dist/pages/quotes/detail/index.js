"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/quotes/detail/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/detail/index!./src/pages/quotes/detail/index.tsx":
/*!********************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/detail/index!./src/pages/quotes/detail/index.tsx ***!
  \********************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ QuoteDetailPage; }
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
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);



/**
 * 报价单详情页（含 Sales 快捷编辑）
 *
 * @description 核心功能：查看报价单详情。
 * Sales 角色底部显示「快捷编辑」按钮（改单价/改数量/替换商品/删除商品）。
 * 保存后触发重新计算总价并同步服务端。
 */







function QuoteDetailPage() {
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_6__.useAuthStore)(),
    currentRole = _useAuthStore.currentRole;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(null),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    quote = _useState2[0],
    setQuote = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    editMode = _useState6[0],
    setEditMode = _useState6[1];
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
            return _services_api__WEBPACK_IMPORTED_MODULE_7__.api.get("/quotes/".concat(id));
          case 2:
            res = _context.v;
            if (res.success) setQuote(res.data);
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
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "page flex-center",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        children: "\u52A0\u8F7D\u4E2D..."
      })
    });
  }
  if (!quote) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "page flex-center",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        children: "\u62A5\u4EF7\u5355\u4E0D\u5B58\u5728"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "quote-detail-page",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      className: "detail-scroll",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "detail-header card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "flex-between",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "quote-no",
            children: quote.quoteNo
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "quote-status",
            children: quote.statusText
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "customer-name",
          children: quote.customerName
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "customer-phone",
          children: quote.customerPhone
        }), quote.address && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "quote-address",
          children: quote.address
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "quote-date",
          children: quote.createdAt
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "items-section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "section-title",
          children: "\u5546\u54C1\u660E\u7EC6"
        }), quote.rooms.map(function (room) {
          var roomItems = quote.items.filter(function (i) {
            return quote.items.some(function (item) {
              return item.roomName === room.name;
            });
          });
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "room-group",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "room-name",
              children: ["\uD83D\uDCD0 ", room.name]
            }), quote.items.filter(function (i) {
              return i.roomName === room.name;
            }).map(function (item) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "item-row card",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "item-name",
                  children: item.productName
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                  className: "item-spec",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                    children: [item.width, "m \xD7 ", item.height, "m"]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                    children: [" \xD7 ", item.quantity]
                  })]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                  className: "flex-between",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                    className: "item-unit-price",
                    children: ["\u5355\u4EF7 \xA5", item.unitPrice]
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                    className: "item-total",
                    children: ["\xA5", item.totalPrice.toLocaleString()]
                  })]
                })]
              }, item.id);
            })]
          }, room.id);
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "total-bar card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "total-label",
          children: "\u603B\u8BA1"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "total-amount",
          children: ["\xA5", quote.totalAmount.toLocaleString()]
        })]
      }), isSales && !editMode && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "edit-hint",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "Sales \u6A21\u5F0F\uFF1A"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "btn-edit-mode",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateTo({
              url: "/pages/quotes/product-selector/index?quoteId=".concat(quote.id)
            });
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            children: "\u5FEB\u6377\u7F16\u8F91"
          })
        })]
      })]
    })
  });
}

/***/ }),

/***/ "./src/pages/quotes/detail/index.tsx":
/*!*******************************************!*\
  !*** ./src/pages/quotes/detail/index.tsx ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/detail/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/quotes/detail/index!./src/pages/quotes/detail/index.tsx");


var config = {"navigationBarTitleText":"detail"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/quotes/detail/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_quotes_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/quotes/detail/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map