"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageSales/sub-vendors"],{

/***/ "./src/services/lead-service.ts":
/*!**************************************!*\
  !*** ./src/services/lead-service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   leadService: function() { return /* binding */ leadService; }
/* harmony export */ });
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");

var leadService = {
  /**
   * 获取线索列表（带分页）
   * GET /api/miniprogram/leads
   */
  getLeadList: function getLeadList(params) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get('/leads', {
      data: params
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 获取单条线索详情
   * GET /api/miniprogram/leads/:id
   */
  getLeadDetail: function getLeadDetail(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/leads/".concat(id)).then(function (res) {
      return res.data;
    });
  },
  /**
   * 获取指定线索的跟进记录
   * GET /api/miniprogram/leads/:id/followup
   */
  getLeadFollowUps: function getLeadFollowUps(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.get("/leads/".concat(id, "/followup")).then(function (res) {
      return res.data;
    });
  },
  /**
   * 新增跟进记录
   * POST /api/miniprogram/leads/:id/followup
   */
  addFollowUp: function addFollowUp(id, params) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/leads/".concat(id, "/followup"), {
      data: params
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 认领线索
   * POST /api/miniprogram/leads/:id/claim
   */
  claimLead: function claimLead(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/leads/".concat(id, "/claim")).then(function (res) {
      return res.data;
    });
  },
  /**
   * 释放线索到公海池
   * POST /api/miniprogram/leads/:id/release
   */
  releaseLead: function releaseLead(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/leads/".concat(id, "/release")).then(function (res) {
      return res.data;
    });
  },
  /**
   * 作废线索
   * POST /api/miniprogram/leads/:id/void
   */
  voidLead: function voidLead(id, reason) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/leads/".concat(id, "/void"), {
      data: {
        reason: reason
      }
    }).then(function (res) {
      return res.data;
    });
  },
  /**
   * 线索转客户 (后端对应的 API)
   * POST /api/miniprogram/leads/:id/convert
   */
  convertLead: function convertLead(id) {
    return _api__WEBPACK_IMPORTED_MODULE_0__.api.post("/leads/".concat(id, "/convert")).then(function (res) {
      return res.data;
    });
  }
};

/***/ })

}]);
//# sourceMappingURL=sub-vendors.js.map