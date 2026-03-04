"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageCustomer/quote-sign/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/quote-sign/index!./src/packageCustomer/quote-sign/index.tsx":
/*!**********************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/quote-sign/index!./src/packageCustomer/quote-sign/index.tsx ***!
  \**********************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ QuoteSign; }
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
/* harmony import */ var _services_quote_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/services/quote-service */ "./src/services/quote-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);










function QuoteSign() {
  var canvasId = 'signCanvas';
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    quoteId = _useState2[0],
    setQuoteId = _useState2[1];

  // 画布与绘制相关上下文
  var ctxRef = (0,react__WEBPACK_IMPORTED_MODULE_5__.useRef)(null);
  var canvasNodeRef = (0,react__WEBPACK_IMPORTED_MODULE_5__.useRef)(null);
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    isDrawing = _useState4[0],
    setIsDrawing = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    hasSignature = _useState6[0],
    setHasSignature = _useState6[1];

  // Dpr for HiDPI screens
  var dpr = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getSystemInfoSync().pixelRatio || 1;
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(function (params) {
    setQuoteId(params.id || '');
  });
  (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(function () {
    var initCanvas = function initCanvas() {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().nextTick(function () {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().createSelectorQuery().select("#".concat(canvasId)).fields({
          node: true,
          size: true
        }).exec(function (res) {
          if (res && res[0] && res[0].node) {
            var canvas = res[0].node;
            var ctx = canvas.getContext('2d');

            // Set true size
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#1D1D1F'; // $text-title

            ctxRef.current = ctx;
            canvasNodeRef.current = canvas;
          }
        });
      });
    };
    initCanvas();
  }, [dpr]);

  // --- 签名绘制事件 ---
  var handleTouchStart = function handleTouchStart(e) {
    if (!ctxRef.current) return;
    var touch = e.touches[0];
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(touch.x, touch.y);
    setIsDrawing(true);
  };
  var handleTouchMove = function handleTouchMove(e) {
    if (!ctxRef.current || !isDrawing) return;
    var touch = e.touches[0];
    ctxRef.current.lineTo(touch.x, touch.y);
    ctxRef.current.stroke();
    setHasSignature(true);
  };
  var handleTouchEnd = function handleTouchEnd() {
    setIsDrawing(false);
  };

  // --- 操作按钮 ---
  var handleClear = function handleClear() {
    if (!ctxRef.current || !canvasNodeRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasNodeRef.current.width, canvasNodeRef.current.height);
    ctxRef.current.beginPath(); // Reset path
    setHasSignature(false);
  };
  var handleSubmit = function handleSubmit() {
    if (!hasSignature) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请先完成签字',
        icon: 'none'
      });
      return;
    }
    if (!quoteId) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '参数错误',
        icon: 'error'
      });
      return;
    }
    if (!canvasNodeRef.current) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
      title: '提交中...',
      mask: true
    });

    // 1. 生成图片
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().canvasToTempFilePath({
      canvas: canvasNodeRef.current,
      success: function () {
        var _success = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(res) {
          var tempFilePath, _uploadRes$data, uploadRes, signatureUrl, _t;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
            while (1) switch (_context.p = _context.n) {
              case 0:
                tempFilePath = res.tempFilePath;
                _context.p = 1;
                _context.n = 2;
                return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.upload('/upload', tempFilePath, 'file');
              case 2:
                uploadRes = _context.v;
                if (!(!uploadRes.success || !((_uploadRes$data = uploadRes.data) !== null && _uploadRes$data !== void 0 && _uploadRes$data.url))) {
                  _context.n = 3;
                  break;
                }
                throw new Error(uploadRes.error || '上传签名失败');
              case 3:
                signatureUrl = uploadRes.data.url; // 3. 提交报价确认
                _context.n = 4;
                return _services_quote_service__WEBPACK_IMPORTED_MODULE_7__.quoteService.confirmQuote(quoteId, signatureUrl);
              case 4:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '签署成功',
                  icon: 'success',
                  duration: 2000
                });
                setTimeout(function () {
                  // 返回上一页刷新状态
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack();
                }, 2000);
                _context.n = 6;
                break;
              case 5:
                _context.p = 5;
                _t = _context.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: _t.message || '确认失败，请重试',
                  icon: 'none'
                });
              case 6:
                return _context.a(2);
            }
          }, _callee, null, [[1, 5]]);
        }));
        function success(_x) {
          return _success.apply(this, arguments);
        }
        return success;
      }(),
      fail: function fail(err) {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
        console.error('Failed to export signature image:', err);
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
          title: '生成截取图片失败',
          icon: 'error'
        });
      }
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "quote-sign-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "header-info",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "title",
        children: "\u8BF7\u5728\u4E0B\u65B9\u7A7A\u767D\u5904\u7B7E\u540D"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "subtitle",
        children: ["\u5355\u53F7\uFF1A", quoteId]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "canvas-container",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Canvas, {
        type: "2d",
        id: canvasId,
        className: "sign-canvas",
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        disableScroll: true
      }), !hasSignature && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "canvas-placeholder",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          children: "\u5728\u6B64\u533A\u57DF\u624B\u5199\u7B7E\u540D"
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "agreements",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "text",
        children: "\u7B7E\u7F72\u5373\u8868\u793A\u60A8\u5DF2\u7ECF\u9605\u8BFB\u5E76\u540C\u610F"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "link",
        children: "\u300A\u65BD\u5DE5\u62A5\u4EF7\u534F\u8BAE\u6761\u7EA6\u300B"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "text",
        children: "\uFF0C\u672C\u62A5\u4EF7\u4EC5\u4F5C\u4E3A\u9884\u4F30\u53C2\u8003\uFF0C\u6700\u7EC8\u4EE5\u5B9E\u9645\u6D4B\u91CF\u786E\u8BA4\u4E3A\u51C6\u3002"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "action-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn btn-outline",
        onClick: handleClear,
        children: "\u91CD\u7B7E"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn btn-primary ".concat(!hasSignature ? 'disabled' : ''),
        onClick: handleSubmit,
        children: "\u786E\u8BA4\u63D0\u4EA4"
      })]
    })]
  });
}

/***/ }),

/***/ "./src/packageCustomer/quote-sign/index.tsx":
/*!**************************************************!*\
  !*** ./src/packageCustomer/quote-sign/index.tsx ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_quote_sign_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/quote-sign/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/quote-sign/index!./src/packageCustomer/quote-sign/index.tsx");


var config = {"navigationBarTitleText":"确认并签字","disableScroll":true,"backgroundColor":"#FFFFFF"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_quote_sign_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageCustomer/quote-sign/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_quote_sign_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_quote_sign_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_quote_sign_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_quote_sign_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["packageCustomer/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/packageCustomer/quote-sign/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map