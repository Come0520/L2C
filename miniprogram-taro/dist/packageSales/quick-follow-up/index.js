"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageSales/quick-follow-up/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/quick-follow-up/index!./src/packageSales/quick-follow-up/index.tsx":
/*!**************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/quick-follow-up/index!./src/packageSales/quick-follow-up/index.tsx ***!
  \**************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ QuickFollowUpPage; }
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
/* harmony import */ var _services_lead_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/services/lead-service */ "./src/services/lead-service.ts");
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);











function QuickFollowUpPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    leadId = _useState2[0],
    setLeadId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(''),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    content = _useState4[0],
    setContent = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(''),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    nextDate = _useState6[0],
    setNextDate = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)([]),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState7, 2),
    images = _useState8[0],
    setImages = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState9, 2),
    submitting = _useState0[0],
    setSubmitting = _useState0[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useLoad)(function (params) {
    if (params.id) setLeadId(params.id);
  });
  var handleDateChange = function handleDateChange(e) {
    return setNextDate(e.detail.value);
  };
  var handleChooseImage = function handleChooseImage() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().chooseMedia({
      count: 3 - images.length,
      mediaType: ['image'],
      success: function success(res) {
        var paths = res.tempFiles.map(function (f) {
          return f.tempFilePath;
        });
        setImages(function (prev) {
          return [].concat((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(prev), (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(paths));
        });
      }
    });
  };
  var handleRemoveImage = function handleRemoveImage(index) {
    setImages(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var finalContent, uploadTasks, uploadedUrls, urlString, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!content.trim() && images.length === 0)) {
              _context.n = 1;
              break;
            }
            return _context.a(2, _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '内容或图片不能为空',
              icon: 'none'
            }));
          case 1:
            if (leadId) {
              _context.n = 2;
              break;
            }
            return _context.a(2, _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '线索ID缺失',
              icon: 'error'
            }));
          case 2:
            setSubmitting(true);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
              title: '提交中...',
              mask: true
            });
            _context.p = 3;
            // 1. 上传图片 (如有)
            finalContent = content.trim();
            if (!(images.length > 0)) {
              _context.n = 5;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
              title: '上传图片...',
              mask: true
            });
            uploadTasks = images.map(function (path) {
              return _services_api__WEBPACK_IMPORTED_MODULE_8__.api.upload('/upload', path, 'file');
            });
            _context.n = 4;
            return Promise.all(uploadTasks);
          case 4:
            uploadedUrls = _context.v;
            // 后端表结构暂无 images 字段，将图片附件以 Markdown 格式或纯文本拼接到 content 后
            urlString = uploadedUrls.map(function (res, i) {
              var _res$data;
              return "\n[\u9644\u4EF6".concat(i + 1, "]: ").concat(((_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.url) || '');
            }).join('');
            finalContent += "\n".concat(urlString);
          case 5:
            // 2. 拼接计划跟进日期（因后端目前可能未处理 nextFollowupAt，也追加在正文作为备用记录）
            if (nextDate) {
              finalContent += "\n\n[\u8BA1\u5212\u4E0B\u6B21\u8DDF\u8FDB: ".concat(nextDate, "]");
            }

            // 3. 提交 API
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
              title: '保存记录...',
              mask: true
            });
            _context.n = 6;
            return _services_lead_service__WEBPACK_IMPORTED_MODULE_7__.leadService.addFollowUp(leadId, {
              content: finalContent,
              type: 'PHONE_CALL',
              // TODO: 可扩展跟进方式选择，当前默认电话
              nextFollowUpDate: nextDate || undefined // 传给后端备用
            });
          case 6:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '提交成功',
              icon: 'success'
            });
            setTimeout(function () {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateBack();
            }, 1000);
            _context.n = 8;
            break;
          case 7:
            _context.p = 7;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '提交失败，请重试',
              icon: 'none'
            });
          case 8:
            _context.p = 8;
            setSubmitting(false);
            return _context.f(8);
          case 9:
            return _context.a(2);
        }
      }, _callee, null, [[3, 7, 8, 9]]);
    }));
    return function handleSubmit() {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "quick-follow-page",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "form-card card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Textarea, {
          className: "content-input",
          placeholder: "\u8BB0\u5F55\u8FD9\u6B21\u8DDF\u8FDB\u7684\u8BE6\u7EC6\u60C5\u51B5\u3001\u5BA2\u6237\u7684\u987E\u8651\u6216\u9636\u6BB5\u6027\u6210\u679C...",
          value: content,
          onInput: function onInput(e) {
            return setContent(e.detail.value);
          },
          maxlength: 500
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "image-uploader",
          children: [images.map(function (img, idx) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "img-box",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Image, {
                src: img,
                mode: "aspectFill",
                className: "img"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
                className: "rm-btn",
                onClick: function onClick() {
                  return handleRemoveImage(idx);
                },
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                  className: "x-icon",
                  children: "\xD7"
                })
              })]
            }, idx);
          }), images.length < 3 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "upload-btn",
            onClick: handleChooseImage,
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "plus",
              children: "+"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "lbl",
              children: "\u4E0A\u4F20\u56FE\u7247"
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "form-card card settings",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "set-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "label",
            children: "\uD83D\uDCCC \u4E0B\u6B21\u8DDF\u8E2A\u65E5\u671F"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Picker, {
            mode: "date",
            onChange: handleDateChange,
            value: nextDate,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "picker-val",
              children: [nextDate ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "date-txt",
                children: nextDate
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "placeholder",
                children: "\u8BF7\u9009\u62E9 (\u9009\u586B)"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "arrow",
                children: '>'
              })]
            })
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
        className: "btn-submit",
        disabled: submitting,
        onClick: handleSubmit,
        children: "\u53D1\u5E03\u8DDF\u8FDB"
      })]
    })
  });
}

/***/ }),

/***/ "./src/packageSales/quick-follow-up/index.tsx":
/*!****************************************************!*\
  !*** ./src/packageSales/quick-follow-up/index.tsx ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_quick_follow_up_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/quick-follow-up/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/quick-follow-up/index!./src/packageSales/quick-follow-up/index.tsx");


var config = {"navigationBarTitleText":"写跟进","backgroundColor":"#F2F2F7"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_quick_follow_up_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageSales/quick-follow-up/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_quick_follow_up_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_quick_follow_up_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_quick_follow_up_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_quick_follow_up_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["packageSales/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/packageSales/quick-follow-up/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map