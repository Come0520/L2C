"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageCustomer/order-track/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/order-track/index!./src/packageCustomer/order-track/index.tsx":
/*!************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/order-track/index!./src/packageCustomer/order-track/index.tsx ***!
  \************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ OrderTrack; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _services_order_service__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/services/order-service */ "./src/services/order-service.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









function OrderTrack() {
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    orderId = _useState2[0],
    setOrderId = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(null),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    order = _useState4[0],
    setOrder = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(true),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)([]),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    timeline = _useState8[0],
    setTimeline = _useState8[1];
  (0,_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__.useLoad)(/*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee(params) {
      var id;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            id = params.id || '';
            if (id) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '订单号为空',
              icon: 'error'
            });
            setLoading(false);
            return _context.a(2);
          case 1:
            setOrderId(id);
            _context.n = 2;
            return fetchTimeline(id);
          case 2:
            return _context.a(2);
        }
      }, _callee);
    }));
    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }());
  var fetchTimeline = /*#__PURE__*/function () {
    var _ref2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2(id) {
      var data, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            setLoading(true);
            _context2.p = 1;
            _context2.n = 2;
            return _services_order_service__WEBPACK_IMPORTED_MODULE_6__.orderService.getOrderDetail(id);
          case 2:
            data = _context2.v;
            setOrder(data);
            buildTimelineUI(data);
            _context2.n = 4;
            break;
          case 3:
            _context2.p = 3;
            _t = _context2.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
              title: '获取订单失败',
              icon: 'none'
            });
          case 4:
            _context2.p = 4;
            setLoading(false);
            return _context2.f(4);
          case 5:
            return _context2.a(2);
        }
      }, _callee2, null, [[1, 3, 4, 5]]);
    }));
    return function fetchTimeline(_x2) {
      return _ref2.apply(this, arguments);
    };
  }();
  var buildTimelineUI = function buildTimelineUI(orderData) {
    var _statusWeights$orderD;
    var steps = [{
      key: 'SIGNED',
      title: '订单已确认',
      desc: '您的订单已正式生效',
      type: 'confirm'
    }, {
      key: 'MEASURED',
      title: '上门量尺完成',
      desc: '现场测量尺寸完成',
      type: 'measure'
    }, {
      key: 'PENDING_DELIVERY',
      title: '定制生产完成',
      desc: '产品生产完毕，等待外发发货',
      type: 'factory'
    }, {
      key: 'PENDING_INSTALL',
      title: '待上门安装',
      desc: '正在为您安排安装师傅',
      type: 'shipping'
    }, {
      key: 'INSTALLATION_COMPLETED',
      title: '安装完成',
      desc: '现场安装已完工并交验',
      type: 'install'
    }, {
      key: 'COMPLETED',
      title: '已签收',
      desc: '期待再次为您服务',
      type: 'finish'
    }];
    var statusWeights = {
      'DRAFT': 0,
      'PENDING_MEASURE': 0,
      'QUOTED': 0,
      'SIGNED': 1,
      'PAID': 1,
      'PENDING_PO': 1,
      'PENDING_PRODUCTION': 1,
      'IN_PRODUCTION': 1,
      'MEASURED': 2,
      'PENDING_DELIVERY': 3,
      'PENDING_INSTALL': 4,
      'INSTALLATION_COMPLETED': 5,
      'PENDING_CONFIRMATION': 5,
      'COMPLETED': 6
    };
    var currentWeight = (_statusWeights$orderD = statusWeights[orderData.status]) !== null && _statusWeights$orderD !== void 0 ? _statusWeights$orderD : 0;
    var generated = steps.map(function (s, idx) {
      var stepWeight = idx + 1;
      var timelineStatus = 'pending';
      if (currentWeight >= stepWeight) timelineStatus = 'completed';
      if (currentWeight === stepWeight) timelineStatus = 'active';

      // 使用更新时间或创建时间作为参考
      var baseDate = new Date(orderData.updatedAt || orderData.createdAt);
      var dateStr = baseDate.toISOString().split('T')[0];
      var timeStr = baseDate.toTimeString().split(' ')[0];
      return {
        id: idx,
        title: s.title,
        description: currentWeight >= stepWeight ? s.desc : '等待进行中...',
        date: currentWeight >= stepWeight ? dateStr : '--',
        time: currentWeight >= stepWeight ? timeStr : '--',
        status: timelineStatus,
        type: s.type
      };
    }).reverse(); // 最近在最上

    setTimeline(generated);
  };
  var handleCopy = function handleCopy() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().setClipboardData({
      data: orderId,
      success: function success() {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  };
  var getStatusText = function getStatusText(status) {
    if (!status) return '未知';
    var map = {
      'DRAFT': '草稿',
      'SIGNED': '已签订',
      'PAID': '已付款',
      'MEASURED': '已量尺',
      'PENDING_DELIVERY': '待发货',
      'PENDING_INSTALL': '待安装',
      'INSTALLATION_COMPLETED': '已安装',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消'
    };
    return map[status] || status;
  };
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "order-track-page",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "loading",
        children: "\u52A0\u8F7D\u8FDB\u5EA6\u4E2D..."
      })
    });
  }
  if (!order) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "order-track-page flex-center",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
        children: "\u67E5\u65E0\u6B64\u8BA2\u5355"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "order-track-page",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "header-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "order-no-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: "\u8BA2\u5355\u7F16\u53F7"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "right",
            onClick: handleCopy,
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "value",
              children: order.orderNo
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "copy-btn",
              children: "\u590D\u5236"
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "status-row",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: "\u5F53\u524D\u72B6\u6001"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "status-text active",
            children: getStatusText(order.status)
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "timeline-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
          className: "section-title",
          children: "\u8DDF\u8FDB\u8F68\u8FF9"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "timeline-container",
          children: timeline.map(function (item, index) {
            var isFirst = index === 0;
            var isLast = index === timeline.length - 1;
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "timeline-item ".concat(isFirst ? 'is-first' : ''),
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "time-col",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "date",
                  children: item.date !== '--' ? item.date.slice(5) : '--'
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "time",
                  children: item.time !== '--' ? item.time.slice(0, 5) : '--'
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "track-col",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                  className: "dot ".concat(item.status)
                }), !isLast && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                  className: "line"
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "content-col",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "title",
                  children: item.title
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                  className: "desc",
                  children: item.description
                })]
              })]
            }, item.id);
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "safe-area-bottom"
      })]
    })
  });
}

/***/ }),

/***/ "./src/packageCustomer/order-track/index.tsx":
/*!***************************************************!*\
  !*** ./src/packageCustomer/order-track/index.tsx ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_order_track_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/order-track/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/order-track/index!./src/packageCustomer/order-track/index.tsx");


var config = {"navigationBarTitleText":"订单进度","backgroundColor":"#F2F2F7"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_order_track_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageCustomer/order-track/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_order_track_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_order_track_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_order_track_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_order_track_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ }),

/***/ "./src/services/order-service.ts":
/*!***************************************!*\
  !*** ./src/services/order-service.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   orderService: function() { return /* binding */ orderService; }
/* harmony export */ });
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");

var orderService = {
  /**
   * 获取订单列表
   * GET /api/miniprogram/orders
   */
  getOrderList: function getOrderList(params) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/orders', {
      data: params
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 获取单个订单详情
   * GET /api/miniprogram/orders/:id
   */
  getOrderDetail: function getOrderDetail(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/orders/".concat(id)).then(function (res) {
      return res.data;
    });
  },
  /**
  * 依据报价单直接创建订单
  * POST /api/miniprogram/orders
  */
  createOrder: function createOrder(quoteId) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/orders', {
      data: {
        quoteId: quoteId
      }
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 提交售后工单
   * POST /api/miniprogram/service/tickets
   */
  createServiceTicket: function createServiceTicket(reqData) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/service/tickets', {
      data: reqData
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 提交收款记录
   * POST /api/miniprogram/orders/payments
   */
  submitPayment: function submitPayment(data) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post('/orders/payments', {
      data: data
    }).then(function (res) {
      return res.data;
    });
  }
};

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/packageCustomer/order-track/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map