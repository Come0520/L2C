"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageCustomer/after-sales/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/after-sales/index!./src/packageCustomer/after-sales/index.tsx":
/*!************************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/after-sales/index!./src/packageCustomer/after-sales/index.tsx ***!
  \************************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ AfterSalesPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/regenerator.js */ "./node_modules/@babel/runtime/helpers/esm/regenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js */ "./node_modules/@babel/runtime/helpers/esm/asyncToGenerator.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js */ "./node_modules/@babel/runtime/helpers/esm/toConsumableArray.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @/services/api */ "./src/services/api.ts");
/* harmony import */ var _utils_validate__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! @/utils/validate */ "./src/utils/validate.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__);













var SERVICE_TYPES = [{
  label: '维修',
  value: 'REPAIR'
}, {
  label: '退货',
  value: 'RETURN'
}, {
  label: '换货',
  value: 'EXCHANGE'
}, {
  label: '投诉',
  value: 'COMPLAINT'
}, {
  label: '咨询',
  value: 'CONSULTATION'
}];
function AfterSalesPage() {
  var _SERVICE_TYPES$find;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_8__.useState)({
      orderId: '',
      description: '',
      phone: '',
      type: ''
    }),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState, 2),
    form = _useState2[0],
    setForm = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_8__.useState)([]),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState3, 2),
    images = _useState4[0],
    setImages = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_8__.useState)(false),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_5__["default"])(_useState5, 2),
    loading = _useState6[0],
    setLoading = _useState6[1];
  var update = function update(field) {
    return function (value) {
      return setForm(function (prev) {
        return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, prev), {}, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_3__["default"])({}, field, value));
      });
    };
  };
  var handleTypeChange = function handleTypeChange(e) {
    setForm(function (prev) {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_4__["default"])({}, prev), {}, {
        type: SERVICE_TYPES[e.detail.value].value
      });
    });
  };
  var addImage = function addImage() {
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().chooseMedia({
      count: 9 - images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function success(res) {
        var tempPaths = res.tempFiles.map(function (f) {
          return f.tempFilePath;
        });
        setImages(function (prev) {
          return [].concat((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(prev), (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_toConsumableArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(tempPaths)).slice(0, 9);
        });
      }
    });
  };
  var handleRemovePhoto = function handleRemovePhoto(index) {
    setImages(function (prev) {
      return prev.filter(function (_, i) {
        return i !== index;
      });
    });
  };
  var handleSubmit = /*#__PURE__*/function () {
    var _ref = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_asyncToGenerator_js__WEBPACK_IMPORTED_MODULE_1__["default"])(/*#__PURE__*/(0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().m(function _callee() {
      var uploadedUrls, uploadTasks, results, res, _t;
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_regenerator_js__WEBPACK_IMPORTED_MODULE_0__["default"])().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (form.type) {
              _context.n = 1;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
              title: '请选择售后类型',
              icon: 'none'
            });
            return _context.a(2);
          case 1:
            if (form.orderId.trim()) {
              _context.n = 2;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
              title: '请输入关联订单号',
              icon: 'none'
            });
            return _context.a(2);
          case 2:
            if ((0,_utils_validate__WEBPACK_IMPORTED_MODULE_10__.isNotEmpty)(form.description)) {
              _context.n = 3;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
              title: '请填写完善的问题描述',
              icon: 'none'
            });
            return _context.a(2);
          case 3:
            if (!(form.phone && !(0,_utils_validate__WEBPACK_IMPORTED_MODULE_10__.isValidPhone)(form.phone))) {
              _context.n = 4;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
              title: '电话格式不正确',
              icon: 'none'
            });
            return _context.a(2);
          case 4:
            setLoading(true);
            _context.p = 5;
            uploadedUrls = []; // 1. 上传图片附件
            if (!(images.length > 0)) {
              _context.n = 7;
              break;
            }
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showLoading({
              title: '上传图片...',
              mask: true
            });
            uploadTasks = images.map(function (path) {
              return _services_api__WEBPACK_IMPORTED_MODULE_9__.api.upload('/upload', path, 'file');
            });
            _context.n = 6;
            return Promise.all(uploadTasks);
          case 6:
            results = _context.v;
            uploadedUrls = results.map(function (res) {
              var _res$data;
              return (_res$data = res.data) === null || _res$data === void 0 ? void 0 : _res$data.url;
            }).filter(Boolean);
          case 7:
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showLoading({
              title: '提交申请...',
              mask: true
            });
            // 2. 提交工单
            _context.n = 8;
            return _services_api__WEBPACK_IMPORTED_MODULE_9__.api.post('/service/tickets', {
              data: {
                orderId: form.orderId,
                type: form.type,
                description: form.description + (form.phone ? "\n\n\u8054\u7CFB\u7535\u8BDD: ".concat(form.phone) : ''),
                photos: uploadedUrls
              }
            });
          case 8:
            res = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().hideLoading();
            if (res.success || typeof res.success === 'undefined') {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
                title: '提交成功',
                icon: 'success'
              });
              setTimeout(function () {
                return _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().navigateBack();
              }, 1500);
            } else {
              _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
                title: res.error || '提交失败',
                icon: 'none'
              });
            }
            _context.n = 10;
            break;
          case 9:
            _context.p = 9;
            _t = _context.v;
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().hideLoading();
            _tarojs_taro__WEBPACK_IMPORTED_MODULE_7___default().showToast({
              title: _t.message || '网络请求失败',
              icon: 'none'
            });
          case 10:
            _context.p = 10;
            setLoading(false);
            return _context.f(10);
          case 11:
            return _context.a(2);
        }
      }, _callee, null, [[5, 9, 10, 11]]);
    }));
    return function handleSubmit() {
      return _ref.apply(this, arguments);
    };
  }();
  var currentTypeLabel = ((_SERVICE_TYPES$find = SERVICE_TYPES.find(function (t) {
    return t.value === form.type;
  })) === null || _SERVICE_TYPES$find === void 0 ? void 0 : _SERVICE_TYPES$find.label) || '请选择问题类型';
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
    className: "after-sales-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "page-header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "title",
          children: "\u7533\u8BF7\u552E\u540E\u670D\u52A1"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "subtitle",
          children: "\u6211\u4EEC\u5C06\u5C3D\u5FEB\u4E3A\u60A8\u89E3\u51B3\u95EE\u9898"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "section-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "form-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "label",
            children: ["\u670D\u52A1\u7C7B\u578B", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
              className: "required",
              children: "*"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Picker, {
            mode: "selector",
            range: SERVICE_TYPES,
            rangeKey: "label",
            onChange: handleTypeChange,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
              className: "picker-value ".concat(!form.type ? 'placeholder' : ''),
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
                children: currentTypeLabel
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
                className: "arrow",
                children: '>'
              })]
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "form-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "label",
            children: ["\u5173\u8054\u8BA2\u5355", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
              className: "required",
              children: "*"
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
            className: "input-field",
            placeholder: "\u8BF7\u8F93\u5165\u76F8\u5173\u8BA2\u5355\u53F7",
            value: form.orderId,
            onInput: function onInput(e) {
              return update('orderId')(e.detail.value);
            }
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "form-item",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "label",
            children: "\u8054\u7CFB\u7535\u8BDD"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Input, {
            className: "input-field",
            type: "number",
            maxlength: 11,
            placeholder: "\u8BF7\u8F93\u5165\u60A8\u7684\u624B\u673A\u53F7",
            value: form.phone,
            onInput: function onInput(e) {
              return update('phone')(e.detail.value);
            }
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "section-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "section-title",
          children: ["\u95EE\u9898\u63CF\u8FF0", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "required",
            children: "*"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "textarea-wrapper",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Textarea, {
            className: "desc-textarea",
            placeholder: "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u60A8\u9047\u5230\u7684\u95EE\u9898\uFF0C\u4EE5\u4FBF\u6211\u4EEC\u66F4\u597D\u5730\u4E3A\u60A8\u670D\u52A1...",
            value: form.description,
            onInput: function onInput(e) {
              return update('description')(e.detail.value);
            },
            maxlength: 500
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
            className: "word-count",
            children: [form.description.length, "/500"]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "section-card photo-section",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
          className: "section-title",
          children: ["\u4E0A\u4F20\u7167\u7247 (", images.length, "/9)"]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
          className: "photo-grid",
          children: [images.map(function (img, idx) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
              className: "photo-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Image, {
                className: "img",
                src: img,
                mode: "aspectFill"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
                className: "remove-btn",
                onClick: function onClick() {
                  return handleRemovePhoto(idx);
                },
                children: "\u2715"
              })]
            }, idx);
          }), images.length < 9 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
            className: "upload-btn",
            onClick: addImage,
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
              className: "plus",
              children: "+"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Text, {
              className: "tip",
              children: "\u6DFB\u52A0\u7167\u7247"
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
        className: "safe-area-bottom"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.View, {
      className: "bottom-action-bar",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_6__.Button, {
        className: "btn-primary",
        loading: loading,
        disabled: loading || !form.type || form.description.length === 0 || !form.orderId.trim(),
        onClick: handleSubmit,
        children: "\u63D0\u4EA4\u7533\u8BF7"
      })
    })]
  });
}

/***/ }),

/***/ "./src/packageCustomer/after-sales/index.tsx":
/*!***************************************************!*\
  !*** ./src/packageCustomer/after-sales/index.tsx ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_after_sales_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/after-sales/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageCustomer/after-sales/index!./src/packageCustomer/after-sales/index.tsx");


var config = {"navigationBarTitleText":"apply"};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_after_sales_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageCustomer/after-sales/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_after_sales_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_after_sales_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_after_sales_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageCustomer_after_sales_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/packageCustomer/after-sales/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map