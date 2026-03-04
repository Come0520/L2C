"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageCustomer/sub-vendors"],{

/***/ "./src/services/customer-service.ts":
/*!******************************************!*\
  !*** ./src/services/customer-service.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   customerService: function() { return /* binding */ customerService; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");



var customerService = {
  /**
   * 客户提交安装验收
   * POST /api/miniprogram/orders/:id/install-accept
   */
  acceptInstallation: function acceptInstallation(orderId, data) {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            return _context.a(2, _api__WEBPACK_IMPORTED_MODULE_2__.api.post("/orders/".concat(orderId, "/install-accept"), {
              data: data
            }));
        }
      }, _callee);
    }))();
  },
  /**
   * 这里预留给之后的 refer-share 获取推广数据
   * GET /api/miniprogram/customers/referrals/stats
   */
  getReferralStats: function getReferralStats() {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            return _context2.a(2, _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/customers/referrals/stats').then(function (res) {
              return res.data;
            }));
        }
      }, _callee2);
    }))();
  }
};

/***/ }),

/***/ "./src/services/quote-service.ts":
/*!***************************************!*\
  !*** ./src/services/quote-service.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   quoteService: function() { return /* binding */ quoteService; }
/* harmony export */ });
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");

var quoteService = {
  /**
   * 获取报价单列表
   * GET /api/miniprogram/quotes
   */
  getQuoteList: function getQuoteList(params) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/quotes', {
      data: params
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 获取报价单详情
   * GET /api/miniprogram/quotes/:id
   */
  getQuoteDetail: function getQuoteDetail(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/quotes/".concat(id)).then(function (res) {
      return res.data;
    });
  },
  /**
   * 客户确认签字
   * POST /api/miniprogram/quotes/:id/confirm
   */
  confirmQuote: function confirmQuote(id, signatureUrl) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/quotes/".concat(id, "/confirm"), {
      data: {
        signatureUrl: signatureUrl
      }
    }).then(function (res) {
      return res.data;
    });
  }
};

/***/ })

}]);
//# sourceMappingURL=sub-vendors.js.map