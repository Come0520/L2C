"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageCustomer/acceptance/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/acceptance/index!./src/packageCustomer/acceptance/index.tsx":
/*!**********************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/acceptance/index!./src/packageCustomer/acceptance/index.tsx ***!
  \**********************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ Acceptance; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var _services_customer_service__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/services/customer-service */ "./src/services/customer-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);











function Acceptance() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    orderId = _useState2[0],
    setOrderId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)([]),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    photos = _useState4[0],
    setPhotos = _useState4[1];

  // 画布与绘制相关上下文
  var canvasId = 'acceptanceCanvas';
  var ctxRef = (0,react__WEBPACK_IMPORTED_MODULE_6__.useRef)(null);
  var canvasNodeRef = (0,react__WEBPACK_IMPORTED_MODULE_6__.useRef)(null);
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    isDrawing = _useState6[0],
    setIsDrawing = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    hasSignature = _useState8[0],
    setHasSignature = _useState8[1];

  // Dpr for HiDPI screens
  var dpr = _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().getSystemInfoSync().pixelRatio || 1;
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useLoad)(function (params) {
    setOrderId(params.id || 'OD-20260304-001');
  });
  (0,react__WEBPACK_IMPORTED_MODULE_6__.useEffect)(function () {
    var initCanvas = function initCanvas() {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().nextTick(function () {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().createSelectorQuery().select("#".concat(canvasId)).fields({
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

  // --- 照片上传 ---
  var handleChooseImage = function handleChooseImage() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().chooseMedia({
      count: 4 - photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function success(res) {
        var tempPaths = res.tempFiles.map(function (f) {
          return f.tempFilePath;
        });
        setPhotos(function (prev) {
          return [].concat((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(prev), (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(tempPaths));
        });
      }
    });
  };
  var handleRemovePhoto = function handleRemovePhoto(index) {
    setPhotos(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  };

  // --- 签名绘制事件 ---
  var handleTouchStart = function handleTouchStart(e) {
    if (!ctxRef.current) return;
    var touch = e.touches[0];
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(touch.x, touch.y);
    setIsDrawing(true);
  };
  var handleTouchMove = function handleTouchMove(e) {
    // 阻止外层滚动导致无法顺畅签字
    e.stopPropagation();
    e.preventDefault();
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
    ctxRef.current.beginPath();
    setHasSignature(false);
  };
  var handleSubmit = function handleSubmit() {
    if (photos.length === 0) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
        title: '请至少上传一张验收现场照片',
        icon: 'none'
      });
      return;
    }
    if (!hasSignature) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
        title: '请完成电子签字',
        icon: 'none'
      });
      return;
    }
    if (!canvasNodeRef.current) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
      title: '提交验收中...'
    });

    // 1. 生成签名图片
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().canvasToTempFilePath({
      canvas: canvasNodeRef.current,
      success: function () {
        var _success = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(res) {
          var signTempPath, photoUploadTasks, signUploadTask, _yield$Promise$all, _yield$Promise$all2, photoResList, signRes, uploadedPhotos, uploadedSign, _t;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
            while (1) switch (_context.p = _context.n) {
              case 0:
                signTempPath = res.tempFilePath;
                _context.p = 1;
                // 2. 并发上传图片和签名
                photoUploadTasks = photos.map(function (p) {
                  return _services_api__WEBPACK_IMPORTED_MODULE_7__.api.upload(p, 'acceptance');
                });
                signUploadTask = _services_api__WEBPACK_IMPORTED_MODULE_7__.api.upload(signTempPath, 'signature');
                _context.n = 2;
                return Promise.all([Promise.all(photoUploadTasks), signUploadTask]);
              case 2:
                _yield$Promise$all = _context.v;
                _yield$Promise$all2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_yield$Promise$all, 2);
                photoResList = _yield$Promise$all2[0];
                signRes = _yield$Promise$all2[1];
                uploadedPhotos = photoResList.map(function (r) {
                  return r.data;
                });
                uploadedSign = signRes.data; // 3. 调用业务 API
                _context.n = 3;
                return _services_customer_service__WEBPACK_IMPORTED_MODULE_8__.customerService.acceptInstallation(orderId, {
                  signatureUrl: uploadedSign,
                  photoUrls: uploadedPhotos
                });
              case 3:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: '验收成功',
                  icon: 'success',
                  duration: 2000
                });
                setTimeout(function () {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateBack();
                }, 2000);
                _context.n = 5;
                break;
              case 4:
                _context.p = 4;
                _t = _context.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: _t.message || '验收提交失败',
                  icon: 'none'
                });
              case 5:
                return _context.a(2);
            }
          }, _callee, null, [[1, 4]]);
        }));
        function success(_x) {
          return _success.apply(this, arguments);
        }
        return success;
      }(),
      fail: function fail(err) {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
        console.error('Failed to export signature image:', err);
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
          title: '生成签字失败',
          icon: 'error'
        });
      }
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "acceptance-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "page-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "title",
          children: "\u5B89\u88C5\u9A8C\u6536\u786E\u8BA4\u5355"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "subtitle",
          children: ["\u8BA2\u5355\uFF1A", orderId]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "section-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "section-title",
          children: ["\u73B0\u573A\u7167\u7247\u5F52\u6863 (", photos.length, "/4)"]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "photo-grid",
          children: [photos.map(function (src, idx) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "photo-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Image, {
                src: src,
                mode: "aspectFill",
                className: "img"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "remove-btn",
                onClick: function onClick() {
                  return handleRemovePhoto(idx);
                },
                children: "\u2715"
              })]
            }, idx);
          }), photos.length < 4 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "upload-btn",
            onClick: handleChooseImage,
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "plus",
              children: "+"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "tip",
              children: "\u6DFB\u52A0\u7167\u7247"
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "section-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "section-title",
          children: "\u5BA2\u6237\u7535\u5B50\u7B7E\u5B57"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "canvas-container",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Canvas, {
            type: "2d",
            id: canvasId,
            className: "sign-canvas",
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            disableScroll: true
          }), !hasSignature && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "canvas-placeholder",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              children: "\u5728\u6B64\u533A\u57DF\u624B\u5199\u7B7E\u540D"
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "clear-row",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "clear-text",
            onClick: handleClear,
            children: "[\u91CD\u65B0\u7B7E\u540D]"
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "agreements",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "text",
          children: "\u7B7E\u7F72\u5373\u4EE3\u8868\u60A8\u786E\u8BA4\u73B0\u573A\u5B89\u88C5\u6570\u91CF\u3001\u5C3A\u5BF8\u3001\u5DE5\u827A\u7B26\u5408\u8981\u6C42\uFF0C\u65E0\u4EFB\u4F55\u7834\u635F\u53CA\u7F3A\u9677\u3002"
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "safe-area-bottom"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "bottom-action-bar",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
        className: "btn-primary ".concat(!hasSignature || photos.length === 0 ? 'disabled' : ''),
        onClick: handleSubmit,
        children: "\u786E\u8BA4\u5E76\u5B8C\u6210\u9A8C\u6536"
      })
    })]
  });
}

/***/ }),

/***/ "./src/packageCustomer/acceptance/index.tsx":
/*!**************************************************!*\
  !*** ./src/packageCustomer/acceptance/index.tsx ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_acceptance_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/acceptance/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/acceptance/index!./src/packageCustomer/acceptance/index.tsx");


var config = {"navigationBarTitleText":"安装验收","backgroundColor":"#F2F2F7","disableScroll":true};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_acceptance_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageCustomer/acceptance/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_acceptance_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_acceptance_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_acceptance_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_acceptance_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["packageCustomer/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/packageCustomer/acceptance/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map