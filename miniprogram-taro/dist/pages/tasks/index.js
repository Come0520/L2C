"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["pages/tasks/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./src/pages/tasks/index.tsx":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./src/pages/tasks/index.tsx ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ TasksPage; }
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
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var _services_task_service__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @/services/task-service */ "./src/services/task-service.ts");
/* harmony import */ var _utils_route_guard__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @/utils/route-guard */ "./src/utils/route-guard.ts");
/* harmony import */ var _components_TabBar_index__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @/components/TabBar/index */ "./src/components/TabBar/index.tsx");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__);




/**
 * 任务页（Worker 专属 TabBar 页）
 *
 * @description Worker 角色的核心页面。
 * 顶部 Tab 切换：待接单 / 进行中 / 已完成
 * 涵盖量尺和安装两种任务类型。
 */










/** 任务状态 Tab */

/** 任务项 */

var TAB_CONFIG = [{
  key: 'pending',
  label: '待接单'
}, {
  key: 'active',
  label: '进行中'
}, {
  key: 'completed',
  label: '已完成'
}];
function TasksPage() {
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useLoad)(function () {
    (0,_utils_route_guard__WEBPACK_IMPORTED_MODULE_10__.requireRole)(['worker']);
  });
  var _useAuthStore = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_7__.useAuthStore)(),
    currentRole = _useAuthStore.currentRole;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)('pending'),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    activeTab = _useState2[0],
    setActiveTab = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)([]),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    tasks = _useState4[0],
    setTasks = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];

  /** 获取任务列表 */
  var fetchTasks = (0,react__WEBPACK_IMPORTED_MODULE_6__.useCallback)(/*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(tab) {
      var statusMap, data, measureTasks, installTasks, merged, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setLoading(true);
            _context.p = 1;
            statusMap = {
              pending: 'pending',
              active: 'in_progress',
              completed: 'completed'
            }; // 此处统一弃用只返回安装任务的 `/engineer/tasks`，改用全量 `/tasks`
            _context.n = 2;
            return _services_task_service__WEBPACK_IMPORTED_MODULE_9__.taskService.getTaskList({
              status: statusMap[tab]
            });
          case 2:
            data = _context.v;
            measureTasks = (data.measureTasks || []).map(function (t) {
              var _t$customer, _t$customer2, _t$customer3;
              return {
                id: t.id,
                type: 'measure',
                customerName: t.customerName || ((_t$customer = t.customer) === null || _t$customer === void 0 ? void 0 : _t$customer.name) || '未知客户',
                address: ((_t$customer2 = t.customer) === null || _t$customer2 === void 0 ? void 0 : _t$customer2.address) || ((_t$customer3 = t.customer) === null || _t$customer3 === void 0 ? void 0 : _t$customer3.community) || '无地址信息',
                scheduledDate: t.scheduledAt ? t.scheduledAt.split(' ')[0] : '待定',
                scheduledTime: t.scheduledAt ? t.scheduledAt.split(' ')[1] || '' : '',
                status: t.status
              };
            });
            installTasks = (data.installTasks || []).map(function (t) {
              return {
                id: t.id,
                type: 'install',
                customerName: t.customerName || '未知客户',
                address: t.address || '无地址信息',
                scheduledDate: t.scheduledDate || '待定',
                scheduledTime: t.scheduledTimeSlot || '',
                status: t.status
              };
            });
            merged = [].concat((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(measureTasks), (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_1__["default"])(installTasks)).sort(function (a, b) {
              var timeA = new Date("".concat(a.scheduledDate, " ").concat(a.scheduledTime)).getTime() || 0;
              var timeB = new Date("".concat(b.scheduledDate, " ").concat(b.scheduledTime)).getTime() || 0;
              return timeB - timeA; // 倒序
            });
            setTasks(merged);
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            console.error('Fetch tasks failed:', _t);
          case 4:
            _context.p = 4;
            setLoading(false);
            return _context.f(4);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3, 4, 5]]);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }(), [currentRole]);
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useDidShow)(function () {
    fetchTasks(activeTab);
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.usePullDownRefresh)(function () {
    fetchTasks(activeTab).then(function () {
      return _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().stopPullDownRefresh();
    });
  });

  /** 切换顶部 Tab */
  var handleTabChange = function handleTabChange(tab) {
    setActiveTab(tab);
    fetchTasks(tab);
  };

  /** 跳转任务详情 (附带 type 参数) */
  var goDetail = function goDetail(task) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().navigateTo({
      url: "/packageWorker/task-detail/index?id=".concat(task.id, "&type=").concat(task.type)
    });
  };

  /** 接受任务（滑动/点击） */
  var acceptTask = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2(taskId, type) {
      var res;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            _context2.n = 1;
            return _services_api__WEBPACK_IMPORTED_MODULE_8__.api.post("/tasks/".concat(taskId), {
              data: {
                type: type,
                action: 'update_status',
                data: {
                  status: type === 'measure' ? 'PENDING_VISIT' : 'PENDING_VISIT'
                }
              }
            });
          case 1:
            res = _context2.v;
            if (res.success) {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                title: '已接单',
                icon: 'success'
              });
              fetchTasks(activeTab);
            }
          case 2:
            return _context2.a(2);
        }
      }, _callee2);
    }));
    return function acceptTask(_x2, _x3) {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "tasks-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "tasks-tabs",
      children: TAB_CONFIG.map(function (tab) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "tasks-tab ".concat(activeTab === tab.key ? 'tasks-tab--active' : ''),
          onClick: function onClick() {
            return handleTabChange(tab.key);
          },
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            children: tab.label
          })
        }, tab.key);
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      className: "tasks-list",
      scrollY: true,
      enhanced: true,
      showScrollbar: false,
      children: [tasks.length === 0 && !loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "empty-state flex-center",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-icon",
          children: "\uD83D\uDCCB"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-text",
          children: activeTab === 'pending' ? '暂无待接单任务' : activeTab === 'active' ? '暂无进行中任务' : '暂无已完成任务'
        })]
      }), tasks.map(function (task) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "task-card card",
          onClick: function onClick() {
            return goDetail(task);
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "task-card__header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "task-type-badge task-type-badge--".concat(task.type),
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                children: task.type === 'measure' ? '量尺' : '安装'
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "task-date",
              children: [task.scheduledDate, " ", task.scheduledTime]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "task-customer",
            children: task.customerName
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "task-address text-ellipsis",
            children: task.address
          }), task.roomCount && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "task-rooms",
            children: [task.roomCount, " \u4E2A\u623F\u95F4"]
          }), activeTab === 'pending' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "task-actions",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "btn-accept",
              onClick: function onClick(e) {
                e.stopPropagation();
                acceptTask(task.id, task.type);
              },
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                children: "\u63A5 \u5355"
              })
            })
          })]
        }, task.id);
      }), loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "loading flex-center",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          children: "\u52A0\u8F7D\u4E2D..."
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_components_TabBar_index__WEBPACK_IMPORTED_MODULE_11__["default"], {
      selected: "/pages/tasks/index"
    })]
  });
}

/***/ }),

/***/ "./src/pages/tasks/index.tsx":
/*!***********************************!*\
  !*** ./src/pages/tasks/index.tsx ***!
  \***********************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=pages/tasks/index!./src/pages/tasks/index.tsx");


var config = {"navigationBarTitleText":"我的任务","enablePullDownRefresh":true};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'pages/tasks/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_pages_tasks_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/pages/tasks/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map