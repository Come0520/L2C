"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageSales/lead-actions/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/lead-actions/index!./src/packageSales/lead-actions/index.tsx":
/*!********************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/lead-actions/index!./src/packageSales/lead-actions/index.tsx ***!
  \********************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LeadActionsPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _services_lead_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/services/lead-service */ "./src/services/lead-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









function LeadActionsPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    leadId = _useState2[0],
    setLeadId = _useState2[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(function (params) {
    if (params.id) setLeadId(params.id);
  });
  var handleAbandon = function handleAbandon() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showModal({
      title: '退回公海',
      content: '确认将该线索退回公海？退回后其他销售或管理员即可再次认领或分配。',
      confirmColor: '#FF3B30',
      success: function () {
        var _success = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(res) {
          var _t;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
            while (1) switch (_context.p = _context.n) {
              case 0:
                if (!res.confirm) {
                  _context.n = 5;
                  break;
                }
                if (leadId) {
                  _context.n = 1;
                  break;
                }
                return _context.a(2);
              case 1:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
                  title: '处理中...',
                  mask: true
                });
                _context.p = 2;
                _context.n = 3;
                return _services_lead_service__WEBPACK_IMPORTED_MODULE_6__.leadService.releaseLead(leadId);
              case 3:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '已退回',
                  icon: 'success'
                });
                setTimeout(function () {
                  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack({
                    delta: 2
                  });
                }, 1500); // 返至线索列表
                _context.n = 5;
                break;
              case 4:
                _context.p = 4;
                _t = _context.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '操作失败',
                  icon: 'none'
                });
              case 5:
                return _context.a(2);
            }
          }, _callee, null, [[2, 4]]);
        }));
        function success(_x) {
          return _success.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var handleVoid = function handleVoid() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showModal({
      title: '作废线索',
      content: '确认作废该线索？此操作不可逆。',
      confirmColor: '#FF3B30',
      success: function () {
        var _success2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2(res) {
          var _t2;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
            while (1) switch (_context2.p = _context2.n) {
              case 0:
                if (!res.confirm) {
                  _context2.n = 5;
                  break;
                }
                if (leadId) {
                  _context2.n = 1;
                  break;
                }
                return _context2.a(2);
              case 1:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
                  title: '处理中...',
                  mask: true
                });
                _context2.p = 2;
                _context2.n = 3;
                return _services_lead_service__WEBPACK_IMPORTED_MODULE_6__.leadService.voidLead(leadId, '小程序端手动操作作废');
              case 3:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '已作废',
                  icon: 'success'
                });
                setTimeout(function () {
                  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack({
                    delta: 2
                  });
                }, 1500);
                _context2.n = 5;
                break;
              case 4:
                _context2.p = 4;
                _t2 = _context2.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '操作失败',
                  icon: 'none'
                });
              case 5:
                return _context2.a(2);
            }
          }, _callee2, null, [[2, 4]]);
        }));
        function success(_x2) {
          return _success2.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var handleTransfer = function handleTransfer() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
      title: '转交功能即将上线',
      icon: 'none'
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "lead-actions-page",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "section-title",
          children: "\u9AD8\u7EA7\u64CD\u4F5C"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card action-card",
          onClick: handleTransfer,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "title",
              children: "\u5206\u914D/\u8F6C\u4EA4\u7EBF\u7D22"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "desc",
              children: "\u5C06\u8BE5\u7EBF\u7D22\u8F6C\u79FB\u7ED9\u5176\u4ED6\u9500\u552E\u4EBA\u5458"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "arrow",
            children: '>'
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card action-card danger",
          onClick: handleAbandon,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "title",
              children: "\u9000\u56DE\u516C\u6D77 (\u653E\u5F03)"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "desc",
              children: "\u653E\u5F03\u8BE5\u7EBF\u7D22\u8DDF\u8FDB\uFF0C\u653E\u5165\u516C\u6D77\u6C60\u4F9B\u4ED6\u4EBA\u8BA4\u9886"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "arrow",
            children: '>'
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card action-card danger",
          onClick: handleVoid,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "info",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "title",
              children: "\u4F5C\u5E9F\u7EBF\u7D22"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "desc",
              children: "\u6807\u8BB0\u4E3A\u65E0\u6548\u7EBF\u7D22\uFF0C\u4E2D\u6B62\u4E00\u5207\u8DDF\u8FDB\u5E76\u5F52\u6863"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "arrow",
            children: '>'
          })]
        })]
      })
    })
  });
}

/***/ }),

/***/ "./src/packageSales/lead-actions/index.tsx":
/*!*************************************************!*\
  !*** ./src/packageSales/lead-actions/index.tsx ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_lead_actions_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/lead-actions/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/lead-actions/index!./src/packageSales/lead-actions/index.tsx");


var config = {"navigationBarTitleText":"线索管理","backgroundColor":"#F2F2F7"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_lead_actions_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageSales/lead-actions/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_lead_actions_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_lead_actions_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_lead_actions_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_lead_actions_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["packageSales/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/packageSales/lead-actions/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map