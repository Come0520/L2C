"use strict";
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageWorker/sub-vendors"],{

/***/ "./src/services/engineer-service.ts":
/*!******************************************!*\
  !*** ./src/services/engineer-service.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   engineerService: function() { return /* binding */ engineerService; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ "./src/services/api.ts");



var engineerService = {
  /**
   * 获取工长结算/收入面板
   * GET /api/miniprogram/engineer/earnings
   */
  getEarnings: function getEarnings() {
    return _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/engineer/earnings').then(function (res) {
      return res.data;
    });
  },
  /**
   * 获取当前租户下待接单的抢单池任务列表
   * API: GET /miniprogram/engineer/tasks/biddable
   */
  getBiddableTasks: function getBiddableTasks() {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            return _context.a(2, _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/engineer/tasks/biddable'));
        }
      }, _callee);
    }))();
  },
  /**
   * 获取某段时间内的工程师排期
   * API: GET /miniprogram/engineer/schedule
   */
  getSchedule: function getSchedule(startDate, endDate) {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee2() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            return _context2.a(2, _api__WEBPACK_IMPORTED_MODULE_2__.api.get('/engineer/schedule', {
              data: {
                startDate: startDate,
                endDate: endDate
              }
            }));
        }
      }, _callee2);
    }))();
  },
  /**
   * 工程师提交完工（包括上传安装后图片等）
   * POST /api/miniprogram/engineer/tasks/:id/complete
   */
  completeTask: function completeTask(taskId, data) {
    return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee3() {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            return _context3.a(2, _api__WEBPACK_IMPORTED_MODULE_2__.api.post("/engineer/tasks/".concat(taskId, "/complete"), {
              data: data
            }).then(function (res) {
              return res.data;
            }));
        }
      }, _callee3);
    }))();
  }
};

/***/ })

}]);
//# sourceMappingURL=sub-vendors.js.map