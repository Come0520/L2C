"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageWorker/liability/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/liability/index!./src/packageWorker/liability/index.tsx":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/liability/index!./src/packageWorker/liability/index.tsx ***!
  \****************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ LiabilityPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);






function LiabilityPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_3__.useState)({
      id: 'L-2026-001',
      taskNo: 'TSK-2026-0302-05',
      type: '安装问题',
      reason: '客户反馈窗帘轨道安装不水平，导致滑动卡顿。经现场核实，测量偏差超过5mm。',
      amount: 50.00,
      status: 'pending',
      // pending, accepted, appealed
      createdAt: '2026-03-04 10:00:00'
    }),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_0__["default"])(_useState, 1),
    liability = _useState2[0];
  var handleAccept = function handleAccept() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().showModal({
      title: '确认判责',
      content: "\u662F\u5426\u786E\u8BA4\u63A5\u53D7\u6B64\u5224\u8D23\u7ED3\u679C\uFF1F\u5C06\u4ECE\u60A8\u7684\u7ED3\u7B97\u6B3E\u4E2D\u6263\u9664 \xA5".concat(liability.amount.toFixed(2), "\u3002"),
      success: function success(res) {
        if (res.confirm) {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().showToast({
            title: '已确认判责',
            icon: 'success'
          });
          setTimeout(function () {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().navigateBack();
          }, 1500);
        }
      }
    });
  };
  var handleAppeal = function handleAppeal() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().showModal({
      title: '发起申诉',
      content: '如对判责结果有异议，请联系平台客服提供申诉材料（现场照片/验收录音等）。',
      confirmText: '联系客服',
      cancelText: '取消',
      success: function success(res) {
        if (res.confirm) {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_2___default().makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        }
      }
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
    className: "liability-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "warning-banner",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "icon",
          children: "\u26A0\uFE0F"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "text",
          children: "\u60A8\u6536\u5230\u4E00\u6761\u65B0\u7684\u552E\u540E\u5224\u8D23\u901A\u77E5\uFF0C\u8BF7\u6CE8\u610F\u67E5\u6536\u5E76\u53CA\u65F6\u5904\u7406\u3002\u8D85\u65F6\u672A\u5904\u7406\u5C06\u9ED8\u8BA4\u540C\u610F\u3002"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "liability-card card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "card-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
            className: "title",
            children: "\u5224\u8D23\u8BE6\u60C5"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
            className: "date",
            children: liability.createdAt
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "info-list",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "info-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
              className: "label",
              children: "\u5173\u8054\u4EFB\u52A1"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
              className: "value",
              children: liability.taskNo
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "info-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
              className: "label",
              children: "\u8D23\u4EFB\u7C7B\u578B"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
              className: "value",
              children: liability.type
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
            className: "info-row penalty",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
              className: "label",
              children: "\u6263\u7F5A\u91D1\u989D"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
              className: "value amount",
              children: ["- \xA5", liability.amount.toFixed(2)]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
          className: "reason-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
            className: "reason-label",
            children: "\u5177\u4F53\u4E8B\u7531\uFF1A"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
            className: "reason-text",
            children: liability.reason
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "tips-card card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "title",
          children: "\u5904\u7406\u987B\u77E5"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "desc",
          children: "1. \u5982\u60A8\u8BA4\u53EF\u8BE5\u5224\u8D23\uFF0C\u8BF7\u70B9\u51FB\u4E0B\u65B9\"\u786E\u8BA4\"\uFF0C\u7CFB\u7EDF\u5C06\u81EA\u52A8\u4ECE\u7ED3\u7B97\u6B3E\u4E2D\u6263\u9664\u5BF9\u5E94\u91D1\u989D\u3002"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Text, {
          className: "desc",
          children: "2. \u5982\u60A8\u6709\u5F02\u8BAE\uFF0C\u8BF7\u5728\u6536\u5230\u901A\u77E5\u540E 48 \u5C0F\u65F6\u5185\u70B9\u51FB\"\u7533\u8BC9\"\u8054\u7CFB\u5BA2\u670D\uFF0C\u903E\u671F\u5C06\u89C6\u4E3A\u63A5\u53D7\u3002"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
      className: "bottom-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        className: "btn btn-appeal",
        onClick: handleAppeal,
        children: "\u5BF9\u6B64\u6709\u5F02\u8BAE\uFF0C\u7533\u8BC9"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        className: "btn btn-accept",
        onClick: handleAccept,
        children: "\u786E\u8BA4\u5224\u8D23"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_1__.View, {
        className: "safe-bottom-space"
      })]
    })]
  });
}

/***/ }),

/***/ "./src/packageWorker/liability/index.tsx":
/*!***********************************************!*\
  !*** ./src/packageWorker/liability/index.tsx ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_liability_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/liability/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/liability/index!./src/packageWorker/liability/index.tsx");


var config = {"navigationBarTitleText":"售后判责单","backgroundColor":"#F2F2F7"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_liability_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageWorker/liability/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_liability_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_liability_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_liability_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_liability_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/packageWorker/liability/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map