"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageSales/measure-review/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/measure-review/index!./src/packageSales/measure-review/index.tsx":
/*!************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/measure-review/index!./src/packageSales/measure-review/index.tsx ***!
  \************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ SalesMeasureReviewPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _services_task_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/services/task-service */ "./src/services/task-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









function SalesMeasureReviewPage() {
  var _taskData$createdAt;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    taskId = _useState2[0],
    setTaskId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(null),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    taskData = _useState4[0],
    setTaskData = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(/*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(options) {
      var id, res, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            id = options.id;
            if (!id) {
              _context.n = 6;
              break;
            }
            setTaskId(id);
            _context.p = 1;
            _context.n = 2;
            return _services_task_service__WEBPACK_IMPORTED_MODULE_6__.taskService.getTaskDetail(id, 'measure');
          case 2:
            res = _context.v;
            setTaskData(res);
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: _t.message || '加载详情失败',
              icon: 'none'
            });
          case 4:
            _context.p = 4;
            setLoading(false);
            return _context.f(4);
          case 5:
            _context.n = 7;
            break;
          case 6:
            setLoading(false);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '参数缺失',
              icon: 'none'
            });
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3, 4, 5]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
  var handleApprove = function handleApprove() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showModal({
      title: '确认复核',
      content: '复核通过后数据将不可更改，是否确认？',
      success: function () {
        var _success = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2(res) {
          var _t2;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
            while (1) switch (_context2.p = _context2.n) {
              case 0:
                if (!res.confirm) {
                  _context2.n = 4;
                  break;
                }
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
                  title: '提交中...'
                });
                _context2.p = 1;
                _context2.n = 2;
                return _services_task_service__WEBPACK_IMPORTED_MODULE_6__.taskService.verifyMeasureData(taskId, 'APPROVE');
              case 2:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '已复核',
                  icon: 'success'
                });
                setTimeout(function () {
                  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack();
                }, 1500);
                _context2.n = 4;
                break;
              case 3:
                _context2.p = 3;
                _t2 = _context2.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: _t2.message || '复核失败',
                  icon: 'none'
                });
              case 4:
                return _context2.a(2);
            }
          }, _callee2, null, [[1, 3]]);
        }));
        function success(_x2) {
          return _success.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var handleDispute = function handleDispute() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showModal({
      title: '申诉打回',
      content: '确认为数据异常/照片不清晰需打回？',
      editable: true,
      placeholderText: '请输入打回理由',
      success: function () {
        var _success2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee3(res) {
          var _t3;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context3) {
            while (1) switch (_context3.p = _context3.n) {
              case 0:
                if (!(res.confirm && res.content)) {
                  _context3.n = 5;
                  break;
                }
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
                  title: '提交中...'
                });
                _context3.p = 1;
                _context3.n = 2;
                return _services_task_service__WEBPACK_IMPORTED_MODULE_6__.taskService.verifyMeasureData(taskId, 'DISPUTE', res.content);
              case 2:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: '已打回重测',
                  icon: 'none'
                });
                setTimeout(function () {
                  return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateBack();
                }, 1500);
                _context3.n = 4;
                break;
              case 3:
                _context3.p = 3;
                _t3 = _context3.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                  title: _t3.message || '申诉失败',
                  icon: 'none'
                });
              case 4:
                _context3.n = 6;
                break;
              case 5:
                if (res.confirm && !res.content) {
                  _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
                    title: '请填写打回理由',
                    icon: 'none'
                  });
                }
              case 6:
                return _context3.a(2);
            }
          }, _callee3, null, [[1, 3]]);
        }));
        function success(_x3) {
          return _success2.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "sales-measure-review-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "empty-tips",
        children: "\u52A0\u8F7D\u4E2D..."
      })
    });
  }
  if (!taskData) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "sales-measure-review-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "empty-tips",
        children: "\u65E0\u4EFB\u52A1\u6570\u636E"
      })
    });
  }

  // 后续从实际字段中读取 measure data 和图片
  var mockImages = ['/assets/images/placeholder.png', '/assets/images/placeholder.png'];
  var mockDataList = [{
    room: '客厅',
    shape: 'L型飘窗',
    width: '2.40m',
    height: '1.80m',
    note: '做满墙，需预留电动轨道电源'
  }, {
    room: '主卧',
    shape: '一字落地窗',
    width: '1.50m',
    height: '2.20m',
    note: '罗马杆'
  }];
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "sales-measure-review-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "page-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "title",
        children: "\u91CF\u5C3A\u6570\u636E\u5BA1\u6838"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        className: "subtitle",
        children: "\u5BA1\u6838\u5DE5\u4EBA\u4E0A\u4F20\u7684\u6700\u7EC8\u6D4B\u91CF\u6570\u636E\u4E0E\u73B0\u573A\u56FE"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "info-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: "\u5173\u8054\u91CF\u5C3A\u5355\uFF1A"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "value highlight",
            children: (taskData === null || taskData === void 0 ? void 0 : taskData.measureNo) || taskId
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "data-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: "\u5E08\u5085\u59D3\u540D\uFF1A"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "value",
            children: taskData !== null && taskData !== void 0 && taskData.assignedWorkerId ? '已指派(缺名字段)' : '待分配'
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "data-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: "\u63D0\u4EA4\u65F6\u95F4\uFF1A"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "value",
            children: taskData === null || taskData === void 0 || (_taskData$createdAt = taskData.createdAt) === null || _taskData$createdAt === void 0 ? void 0 : _taskData$createdAt.substring(0, 10)
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "preview-section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "section-title",
          children: "\u73B0\u573A\u7167\u7247 / \u56FE\u7EB8\u8349\u56FE"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "image-grid",
          children: mockImages.map(function (url, idx) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Image, {
              src: url,
              className: "image-item",
              mode: "aspectFill"
            }, idx);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "preview-section data-section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "section-title",
          children: "\u7A97\u578B\u6570\u636E\u6C47\u603B"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "data-list-wrap",
          children: mockDataList.map(function (item, idx) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "data-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "item-head",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "room",
                  children: item.room
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "shape",
                  children: item.shape
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "item-body",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                  className: "dim",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                    children: "\u5BBD\uFF1A"
                  }), item.width]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                  className: "dim",
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                    children: "\u9AD8\uFF1A"
                  }), item.height]
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "item-foot",
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "note",
                  children: ["\u5907\u6CE8\uFF1A", item.note]
                })
              })]
            }, idx);
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "action-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn dispute",
        onClick: handleDispute,
        children: "\u63D0\u51FA\u7533\u8BC9"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
        className: "btn approve",
        onClick: handleApprove,
        children: "\u6838\u5BF9\u65E0\u8BEF\u786E\u8BA4"
      })]
    })]
  });
}

/***/ }),

/***/ "./src/packageSales/measure-review/index.tsx":
/*!***************************************************!*\
  !*** ./src/packageSales/measure-review/index.tsx ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_measure_review_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/measure-review/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageSales/measure-review/index!./src/packageSales/measure-review/index.tsx");


var config = {"navigationBarTitleText":"量尺审查","backgroundColor":"#F2F2F7"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_measure_review_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageSales/measure-review/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_measure_review_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_measure_review_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_measure_review_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageSales_measure_review_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/packageSales/measure-review/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map