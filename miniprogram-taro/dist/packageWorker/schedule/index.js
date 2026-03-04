"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageWorker/schedule/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/schedule/index!./src/packageWorker/schedule/index.tsx":
/*!**************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/schedule/index!./src/packageWorker/schedule/index.tsx ***!
  \**************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerSchedulePage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _services_engineer_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/services/engineer-service */ "./src/services/engineer-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









function WorkerSchedulePage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(new Date().toISOString().split('T')[0]),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    selectedDate = _useState2[0],
    setSelectedDate = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)({}),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    scheduleMap = _useState4[0],
    setScheduleMap = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];

  // 生成当前周的日期数据 (简化版日历)
  var generateWeekDays = function generateWeekDays() {
    var today = new Date(selectedDate);
    var days = [];
    // 获取当前日期是周几 (0-6, 周日-周六)
    var currentDayIndex = today.getDay();
    // 获取本周一的日期
    var startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDayIndex === 0 ? 6 : currentDayIndex - 1));
    for (var i = 0; i < 7; i++) {
      var date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      var dateStr = date.toISOString().split('T')[0];
      days.push({
        day: ['一', '二', '三', '四', '五', '六', '日'][i],
        date: dateStr,
        num: date.getDate(),
        isToday: dateStr === new Date().toISOString().split('T')[0],
        hasTask: !!(scheduleMap[dateStr] && scheduleMap[dateStr].length > 0)
      });
    }
    return days;
  };
  var weekDays = generateWeekDays();

  // 选中日期下的任务
  var currentTasks = (0,react__WEBPACK_IMPORTED_MODULE_5__.useMemo)(function () {
    return scheduleMap[selectedDate] || [];
  }, [scheduleMap, selectedDate]);

  // 请求当月排期
  var fetchSchedule = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var d, year, month, startDate, endDate, res, newMap, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            setLoading(true);
            d = new Date(selectedDate);
            year = d.getFullYear();
            month = d.getMonth() + 1; // 简单取当月
            startDate = "".concat(year, "-").concat(String(month).padStart(2, '0'), "-01");
            endDate = "".concat(year, "-").concat(String(month).padStart(2, '0'), "-31");
            _context.n = 1;
            return _services_engineer_service__WEBPACK_IMPORTED_MODULE_6__.engineerService.getSchedule(startDate, endDate);
          case 1:
            res = _context.v;
            if (res.success && res.data) {
              // 根据日期进行 grouping
              newMap = {};
              res.data.tasks.forEach(function (task) {
                var dKey = task.date;
                if (!newMap[dKey]) newMap[dKey] = [];
                newMap[dKey].push(task);
              });
              setScheduleMap(newMap);
            }
            _context.n = 3;
            break;
          case 2:
            _context.p = 2;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '加载日程失败',
              icon: 'none'
            });
          case 3:
            _context.p = 3;
            setLoading(false);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().stopPullDownRefresh();
            return _context.f(3);
          case 4:
            return _context.a(2);
        }
      }, _callee, null, [[0, 2, 3, 4]]);
    }));
    return function fetchSchedule() {
      return _ref.apply(this, arguments);
    };
  }();
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(function () {
    fetchSchedule();
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useDidShow)(function () {
    if (!loading && Object.keys(scheduleMap).length === 0) {
      fetchSchedule();
    }
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.usePullDownRefresh)(function () {
    fetchSchedule();
  });
  var handleConfirmChange = function handleConfirmChange(id) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showModal({
      title: '确认时间变更',
      content: '客户申请将上门时间更改为 14:00 - 16:00，是否同意？',
      success: function success(res) {
        if (res.confirm) {
          _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
            title: '已确认',
            icon: 'success'
          });
          fetchSchedule();
        }
      }
    });
  };
  var handleNavTask = function handleNavTask(id, type) {
    // 跳转到全局的任务详情页
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().navigateTo({
      url: "/pages/task-detail/index?id=".concat(id, "&type=").concat(type)
    });
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "worker-schedule-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "calendar-bar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "month-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "month-text",
          children: [selectedDate.split('-')[0], "\u5E74", selectedDate.split('-')[1], "\u6708"]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "btn-today",
          onClick: function onClick() {
            return setSelectedDate(new Date().toISOString().split('T')[0]);
          },
          children: "\u56DE\u5230\u4ECA\u5929"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
        scrollX: true,
        className: "date-scroll",
        showScrollbar: false,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "date-list",
          children: weekDays.map(function (item, idx) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "date-item ".concat(item.date === selectedDate ? 'active' : ''),
              onClick: function onClick() {
                return setSelectedDate(item.date);
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "day",
                children: item.day
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "date",
                children: item.num
              }), item.hasTask && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "dot"
              })]
            }, idx);
          })
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      scrollY: true,
      className: "task-list",
      children: loading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "empty-tips",
        children: "\u52A0\u8F7D\u4E2D..."
      }) : currentTasks.length > 0 ? currentTasks.map(function (task) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "timeline-item",
          onClick: function onClick() {
            return handleNavTask(task.id, task.type);
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "time-col",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "time-text",
              children: task.time.split(' - ')[0] || task.time
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "status-line ".concat(task.status === 'COMPLETED' ? 'gray' : 'active')
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "content-col",
            children: [task.changeNote && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "change-alert",
              onClick: function onClick(e) {
                return e.stopPropagation();
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "alert-header",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "icon",
                  children: "\u26A0\uFE0F"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "title",
                  children: "\u53D8\u66F4\u63D0\u9192"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "note",
                children: task.changeNote
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
                className: "confirm-btn",
                onClick: function onClick() {
                  return handleConfirmChange(task.id);
                },
                children: "\u5DF2\u77E5\u6653\u5E76\u786E\u8BA4"
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "task-card",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "card-header",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "tag ".concat(task.type.toLowerCase()),
                  children: task.title.split(' - ')[0]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "status ".concat(task.status),
                  children: task.status === 'COMPLETED' ? '已完成' : '待服务'
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "address",
                children: task.address
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "time-range",
                children: ["\u9884\u8BA1\u8017\u65F6\uFF1A", task.time]
              })]
            })]
          })]
        }, task.id);
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "end-tips",
        children: "\u5F53\u65E5\u65E0\u6392\u671F\u4EFB\u52A1"
      })
    })]
  });
}

/***/ }),

/***/ "./src/packageWorker/schedule/index.tsx":
/*!**********************************************!*\
  !*** ./src/packageWorker/schedule/index.tsx ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_schedule_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/schedule/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/schedule/index!./src/packageWorker/schedule/index.tsx");


var config = {"navigationBarTitleText":"日程安排","backgroundColor":"#F2F2F7"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_schedule_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageWorker/schedule/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_schedule_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_schedule_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_schedule_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_schedule_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["packageWorker/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/packageWorker/schedule/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map