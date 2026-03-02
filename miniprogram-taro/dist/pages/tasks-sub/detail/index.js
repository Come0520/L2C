"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/tasks-sub/detail/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks-sub/detail/index!./src/pages/tasks-sub/detail/index.tsx":
/*!**************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks-sub/detail/index!./src/pages/tasks-sub/detail/index.tsx ***!
  \**************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ TaskDetailPage; }
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
 * 任务详情页（Worker 专属）
 */






function TaskDetailPage() {
  var _task$images;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(null),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    task = _useState2[0],
    setTask = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
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
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.get("/tasks/".concat(id));
          case 2:
            res = _context.v;
            if (res.success) setTask(res.data);
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
  var handleAction = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2(action) {
      var res, detail;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (task) {
              _context2.n = 1;
              break;
            }
            return _context2.a(2);
          case 1:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
              title: '处理中...'
            });
            _context2.p = 2;
            _context2.n = 3;
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.post("/tasks/".concat(task.id, "/").concat(action));
          case 3:
            res = _context2.v;
            if (!res.success) {
              _context2.n = 5;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '操作成功',
              icon: 'success'
            });
            // 刷新详情
            _context2.n = 4;
            return _services_api__WEBPACK_IMPORTED_MODULE_6__.api.get("/tasks/".concat(task.id));
          case 4:
            detail = _context2.v;
            if (detail.success) setTask(detail.data);
          case 5:
            _context2.p = 5;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2,, 5, 6]]);
    }));
    return function handleAction(_x2) {
      return _ref2.apply(this, arguments);
    };
  }();
  if (loading) return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "page flex-center",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
      children: "\u52A0\u8F7D\u4E2D..."
    })
  });
  if (!task) return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "page flex-center",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
      children: "\u4EFB\u52A1\u4E0D\u5B58\u5728"
    })
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "detail-page",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      className: "detail-scroll",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "info-card card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "flex-between",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "task-no",
            children: task.taskNo
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "task-status",
            children: task.statusText
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "task-type-badge",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            children: task.typeText
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "customer-name",
          children: task.customerName
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "customer-phone",
          children: task.customerPhone
        }), task.address && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "task-address",
          children: ["\uD83D\uDCCD ", task.address]
        }), task.scheduledDate && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "task-date",
          children: ["\uD83D\uDCC5 ", task.scheduledDate]
        }), task.remark && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "task-remark",
          children: ["\uD83D\uDCAC ", task.remark]
        })]
      }), ((_task$images = task.images) === null || _task$images === void 0 ? void 0 : _task$images.length) > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "images-section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "section-title",
          children: "\u73B0\u573A\u56FE\u7247"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "images-grid",
          children: task.images.map(function (img, i) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Image, {
              className: "task-img",
              src: img,
              mode: "aspectFill",
              onClick: function onClick() {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().previewImage({
                  urls: task.images,
                  current: img
                });
              }
            }, i);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "action-bar",
        children: [task.status === 'pending' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
          className: "btn-submit",
          onClick: function onClick() {
            return handleAction('accept');
          },
          children: "\u63A5\u53D7\u4EFB\u52A1"
        }), task.status === 'accepted' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment, {
          children: [task.type === 'measure' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "btn-submit",
            onClick: function onClick() {
              return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateTo({
                url: "/pages/tasks-sub/measure/index?taskId=".concat(task.id)
              });
            },
            children: "\u5F00\u59CB\u91CF\u5C3A"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "btn-complete",
            onClick: function onClick() {
              return handleAction('complete');
            },
            children: "\u6807\u8BB0\u5B8C\u6210"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
          className: "btn-call",
          onClick: function onClick() {
            return _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().makePhoneCall({
              phoneNumber: task.customerPhone
            });
          },
          children: "\uD83D\uDCDE \u8054\u7CFB\u5BA2\u6237"
        })]
      })]
    })
  });
}

/***/ }),

/***/ "./src/pages/tasks-sub/detail/index.tsx":
/*!**********************************************!*\
  !*** ./src/pages/tasks-sub/detail/index.tsx ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_sub_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks-sub/detail/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks-sub/detail/index!./src/pages/tasks-sub/detail/index.tsx");


var config = {"navigationBarTitleText":"taskdetail"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_sub_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/tasks-sub/detail/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_sub_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_sub_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_sub_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_sub_detail_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/tasks-sub/detail/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map