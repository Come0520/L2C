"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageWorker/order-bid/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/order-bid/index!./src/packageWorker/order-bid/index.tsx":
/*!****************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/order-bid/index!./src/packageWorker/order-bid/index.tsx ***!
  \****************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerOrderBidPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _services_engineer_service__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @/services/engineer-service */ "./src/services/engineer-service.ts");
/* harmony import */ var _services_task_service__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @/services/task-service */ "./src/services/task-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);











function WorkerOrderBidPage() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)([]),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState, 2),
    orders = _useState2[0],
    setOrders = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)(false),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_6__.useState)({
      visible: false,
      orderId: '',
      price: '',
      reason: ''
    }),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_3__["default"])(_useState5, 2),
    counterModal = _useState6[0],
    setCounterModal = _useState6[1];
  var fetchTasks = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee() {
      var res, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            setLoading(true);
            _context.n = 1;
            return _services_engineer_service__WEBPACK_IMPORTED_MODULE_7__.engineerService.getBiddableTasks();
          case 1:
            res = _context.v;
            if (res.success || res.data) {
              setOrders(res.data || []);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                title: res.error || '获取抢单池失败',
                icon: 'none'
              });
            }
            _context.n = 3;
            break;
          case 2:
            _context.p = 2;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '网络异常',
              icon: 'none'
            });
          case 3:
            _context.p = 3;
            setLoading(false);
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().stopPullDownRefresh();
            return _context.f(3);
          case 4:
            return _context.a(2);
        }
      }, _callee, null, [[0, 2, 3, 4]]);
    }));
    return function fetchTasks() {
      return _ref.apply(this, arguments);
    };
  }();
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useLoad)(function () {
    fetchTasks();
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.useDidShow)(function () {
    if (!loading && orders.length === 0) {
      fetchTasks();
    }
  });
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_5__.usePullDownRefresh)(function () {
    fetchTasks();
  });
  var handleAccept = function handleAccept(id, price) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showModal({
      title: '确认接单',
      content: "\u540C\u610F\u4EE5 \uFFE5".concat(price, " \u7684\u4EF7\u683C\u63A5\u4E0B\u8BE5\u8BA2\u5355\uFF1F"),
      success: function () {
        var _success = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee2(res) {
          var _t2;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context2) {
            while (1) switch (_context2.p = _context2.n) {
              case 0:
                if (!res.confirm) {
                  _context2.n = 4;
                  break;
                }
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
                  title: '处理中...'
                });
                _context2.p = 1;
                _context2.n = 2;
                return _services_task_service__WEBPACK_IMPORTED_MODULE_8__.taskService.negotiateTask(id, 'ACCEPT');
              case 2:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: '接单成功',
                  icon: 'success'
                });
                fetchTasks(); // Refresh list
                _context2.n = 4;
                break;
              case 3:
                _context2.p = 3;
                _t2 = _context2.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: _t2.message || '接单失败',
                  icon: 'none'
                });
              case 4:
                return _context2.a(2);
            }
          }, _callee2, null, [[1, 3]]);
        }));
        function success(_x) {
          return _success.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var handleReject = function handleReject(id) {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showModal({
      title: '残忍拒绝',
      content: '拒绝后将不在您的抢单池显示，确认拒绝？',
      success: function () {
        var _success2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee3(res) {
          var _t3;
          return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context3) {
            while (1) switch (_context3.p = _context3.n) {
              case 0:
                if (!res.confirm) {
                  _context3.n = 4;
                  break;
                }
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
                  title: '处理中...'
                });
                _context3.p = 1;
                _context3.n = 2;
                return _services_task_service__WEBPACK_IMPORTED_MODULE_8__.taskService.negotiateTask(id, 'REJECT');
              case 2:
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: '已拒绝',
                  icon: 'none'
                });
                setOrders(function (prev) {
                  return prev.filter(function (o) {
                    return o.id !== id;
                  });
                });
                _context3.n = 4;
                break;
              case 3:
                _context3.p = 3;
                _t3 = _context3.v;
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
                _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
                  title: _t3.message || '操作失败',
                  icon: 'none'
                });
              case 4:
                return _context3.a(2);
            }
          }, _callee3, null, [[1, 3]]);
        }));
        function success(_x2) {
          return _success2.apply(this, arguments);
        }
        return success;
      }()
    });
  };
  var openCounterModal = function openCounterModal(id) {
    setCounterModal({
      visible: true,
      orderId: id,
      price: '',
      reason: ''
    });
  };
  var submitCounterOffer = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_2__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().m(function _callee4() {
      var _t4;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (counterModal.price) {
              _context4.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '请输入期望价格',
              icon: 'none'
            });
            return _context4.a(2);
          case 1:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showLoading({
              title: '提交议价...'
            });
            _context4.p = 2;
            _context4.n = 3;
            return _services_task_service__WEBPACK_IMPORTED_MODULE_8__.taskService.negotiateTask(counterModal.orderId, 'COUNTER', {
              price: counterModal.price,
              reason: counterModal.reason
            });
          case 3:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: '议价已提交',
              icon: 'success'
            });
            setCounterModal((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, counterModal), {}, {
              visible: false
            }));
            fetchTasks();
            _context4.n = 5;
            break;
          case 4:
            _context4.p = 4;
            _t4 = _context4.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_5___default().showToast({
              title: _t4.message || '提交失败',
              icon: 'none'
            });
          case 5:
            return _context4.a(2);
        }
      }, _callee4, null, [[2, 4]]);
    }));
    return function submitCounterOffer() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
    className: "order-bid-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "page-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "title",
        children: "\u5F85\u63A5\u5DE5\u5355"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
        className: "subtitle",
        children: ["\u5171 ", orders.length, " \u4E2A\u65B0\u8BA2\u5355\u6B63\u5728\u7B49\u5F85\u5206\u914D"]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.ScrollView, {
      scrollY: true,
      className: "order-list",
      children: orders.length > 0 ? orders.map(function (order) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "order-card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "card-header",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "left",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "tag ".concat(order.type.toLowerCase()),
                children: order.typeLabel
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "order-id",
                children: order.taskNo || order.id
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "distance",
              children: order.distance
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "card-body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "info-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "label",
                children: "\u670D\u52A1\u65F6\u95F4\uFF1A"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "value highlight",
                children: [order.scheduledDate ? order.scheduledDate.substring(0, 10) : '尽快', order.timeSlot ? " ".concat(order.timeSlot) : '']
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "info-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "label",
                children: "\u670D\u52A1\u5730\u5740\uFF1A"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "value",
                children: order.address
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "info-row",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "label",
                children: "\u5BA2\u6237\u79F0\u547C\uFF1A"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "value",
                children: order.customerName
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "card-footer",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "price-area",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "label",
                children: "\u7CFB\u7EDF\u62A5\u4EF7"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
                className: "price",
                children: ["\uFFE5", order.systemPrice]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
              className: "action-area",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
                className: "btn reject",
                onClick: function onClick() {
                  return handleReject(order.id);
                },
                children: "\u62D2\u7EDD"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
                className: "btn counter",
                onClick: function onClick() {
                  return openCounterModal(order.id);
                },
                children: "\u8BAE\u4EF7"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
                className: "btn accept",
                onClick: function onClick() {
                  return handleAccept(order.id, order.systemPrice);
                },
                children: "\u63A5\u5355"
              })]
            })]
          })]
        }, order.id);
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "empty-state",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
          className: "empty-text",
          children: loading ? '加载中...' : '暂无新派单，休息一下吧'
        })
      })
    }), counterModal.visible && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
      className: "modal-overlay",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
        className: "modal-content",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "modal-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "modal-title",
            children: "\u5DE5\u5355\u8BAE\u4EF7"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
            className: "close-btn",
            onClick: function onClick() {
              return setCounterModal((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, counterModal), {}, {
                visible: false
              }));
            },
            children: "\xD7"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "modal-body",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "form-item",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "label",
              children: "\u671F\u671B\u4EF7\u683C (\u5143)"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Input, {
              className: "input price-input",
              type: "digit",
              placeholder: "\u8BF7\u8F93\u5165\u60A8\u7684\u5FC3\u7406\u4EF7\u4F4D",
              value: counterModal.price,
              onInput: function onInput(e) {
                return setCounterModal((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, counterModal), {}, {
                  price: e.detail.value
                }));
              }
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
            className: "form-item",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Text, {
              className: "label",
              children: "\u8BAE\u4EF7\u7406\u7531 (\u9009\u586B)"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Input, {
              className: "input",
              placeholder: "\u5982\uFF1A\u8DEF\u7A0B\u8F83\u8FDC\u3001\u697C\u5C42\u8F83\u9AD8\u65E0\u7535\u68AF\u7B49",
              value: counterModal.reason,
              onInput: function onInput(e) {
                return setCounterModal((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, counterModal), {}, {
                  reason: e.detail.value
                }));
              }
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.View, {
          className: "modal-footer",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
            className: "submit-btn",
            onClick: submitCounterOffer,
            children: "\u63D0\u4EA4\u8BAE\u4EF7\u7533\u8BF7"
          })
        })]
      })
    })]
  });
}

/***/ }),

/***/ "./src/packageWorker/order-bid/index.tsx":
/*!***********************************************!*\
  !*** ./src/packageWorker/order-bid/index.tsx ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_order_bid_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/order-bid/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/order-bid/index!./src/packageWorker/order-bid/index.tsx");


var config = {"navigationBarTitleText":"接单大厅","backgroundColor":"#F2F2F7","enablePullDownRefresh":true};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_order_bid_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageWorker/order-bid/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_order_bid_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_order_bid_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_order_bid_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_order_bid_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["packageWorker/sub-vendors","taro","vendors","common"], function() { return __webpack_exec__("./src/packageWorker/order-bid/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map