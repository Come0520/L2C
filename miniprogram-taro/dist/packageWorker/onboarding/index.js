"use strict";require("../sub-vendors.js");
(wx["webpackJsonp"] = wx["webpackJsonp"] || []).push([["packageWorker/onboarding/index"],{

/***/ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/onboarding/index!./src/packageWorker/onboarding/index.tsx":
/*!******************************************************************************************************************************************!*\
  !*** ./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/onboarding/index!./src/packageWorker/onboarding/index.tsx ***!
  \******************************************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": function() { return /* binding */ WorkerOnboardingPage; }
/* harmony export */ });
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/defineProperty.js */ "./node_modules/@babel/runtime/helpers/esm/defineProperty.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/objectSpread2.js */ "./node_modules/@babel/runtime/helpers/esm/objectSpread2.js");
/* harmony import */ var C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/@babel/runtime/helpers/esm/slicedToArray.js */ "./node_modules/@babel/runtime/helpers/esm/slicedToArray.js");
/* harmony import */ var _tarojs_components__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @tarojs/components */ "./node_modules/@tarojs/plugin-platform-weapp/dist/components-react.js");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @tarojs/taro */ "webpack/container/remote/@tarojs/taro");
/* harmony import */ var _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_tarojs_taro__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ "webpack/container/remote/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _stores_auth__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @/stores/auth */ "./src/stores/auth.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "webpack/container/remote/react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









function WorkerOnboardingPage() {
  var userInfo = (0,_stores_auth__WEBPACK_IMPORTED_MODULE_6__.useAuthStore)(function (state) {
    return state.userInfo;
  });
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(0),
    _useState2 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState, 2),
    currentStep = _useState2[0],
    setCurrentStep = _useState2[1];
  var steps = ['服务规范', '电子合同', '技能考核'];

  // ============================================
  // Step 1: 服务规范
  // ============================================
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState4 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState3, 2),
    agreedSpecs = _useState4[0],
    setAgreedSpecs = _useState4[1];

  // ============================================
  // Step 2: 电子签字 (弹窗式)
  // ============================================
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(''),
    _useState6 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState5, 2),
    signatureUrl = _useState6[0],
    setSignatureUrl = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState8 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState7, 2),
    showSignModal = _useState8[0],
    setShowSignModal = _useState8[1];
  var canvasRef = (0,react__WEBPACK_IMPORTED_MODULE_5__.useRef)(null);
  var ctxRef = (0,react__WEBPACK_IMPORTED_MODULE_5__.useRef)(null);
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false),
    _useState0 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState9, 2),
    isDrawing = _useState0[0],
    setIsDrawing = _useState0[1];
  var lastPos = (0,react__WEBPACK_IMPORTED_MODULE_5__.useRef)({
    x: 0,
    y: 0
  });
  var openSignModal = function openSignModal() {
    setShowSignModal(true);
    setTimeout(function () {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().createSelectorQuery().select('#workerSignCanvas').fields({
        node: true,
        size: true
      }).exec(function (res) {
        if (res && res[0] && res[0].node) {
          var canvas = res[0].node;
          var ctx = canvas.getContext('2d');
          var dpr = _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().getSystemInfoSync().pixelRatio;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctxRef.current = ctx;
          canvasRef.current = canvas;
        }
      });
    }, 500);
  };
  var handleTouchStart = function handleTouchStart(e) {
    if (!ctxRef.current) return;
    setIsDrawing(true);
    var _e$touches$ = e.touches[0],
      x = _e$touches$.x,
      y = _e$touches$.y;
    lastPos.current = {
      x: x,
      y: y
    };
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };
  var handleTouchMove = function handleTouchMove(e) {
    if (!isDrawing || !ctxRef.current) return;
    var _e$touches$2 = e.touches[0],
      x = _e$touches$2.x,
      y = _e$touches$2.y;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    lastPos.current = {
      x: x,
      y: y
    };
  };
  var handleTouchEnd = function handleTouchEnd() {
    setIsDrawing(false);
  };
  var clearCanvas = function clearCanvas() {
    if (!ctxRef.current || !canvasRef.current) return;
    var canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };
  var confirmSignature = function confirmSignature() {
    if (!canvasRef.current) return;
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().canvasToTempFilePath({
      canvas: canvasRef.current,
      success: function success(res) {
        setSignatureUrl(res.tempFilePath);
        setShowSignModal(false);
      },
      fail: function fail() {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
          title: '保存签名失败',
          icon: 'none'
        });
      }
    });
  };

  // ============================================
  // Step 3: 技能考核
  // ============================================
  var examData = [{
    id: 1,
    title: '到达客户现场后，第一步应该做什么？',
    options: ['直接开始施工', '主动出示工牌并穿戴鞋套', '向客户推销其他服务']
  }, {
    id: 2,
    title: '遇到量尺数据与现场不符时如何处理？',
    options: ['自行修改数据继续安装', '强行安装并向客户解释', '标记异常并联系设计师或销售确认']
  }];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)({}),
    _useState10 = (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_slicedToArray_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_useState1, 2),
    answers = _useState10[0],
    setAnswers = _useState10[1];
  var handleSelectAnswer = function handleSelectAnswer(qId, oIdx) {
    setAnswers(function (prev) {
      return (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])((0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_objectSpread2_js__WEBPACK_IMPORTED_MODULE_1__["default"])({}, prev), {}, (0,C_Users_bigey_Documents_Antigravity_L2C_miniprogram_taro_node_modules_babel_runtime_helpers_esm_defineProperty_js__WEBPACK_IMPORTED_MODULE_0__["default"])({}, qId, oIdx));
    });
  };
  var submitOnboarding = function submitOnboarding() {
    if (Object.keys(answers).length < examData.length) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '请回答所有题目',
        icon: 'none'
      });
      return;
    }
    // 检查答案 (简单 mock)
    var passed = answers[1] === 1 && answers[2] === 2;
    if (!passed) {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showModal({
        title: '考核未通过',
        content: '答题有误，请重新检查《服务规范》',
        showCancel: false
      });
      return;
    }
    _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showLoading({
      title: '提交入驻信息...'
    });
    setTimeout(function () {
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().hideLoading();
      _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().showToast({
        title: '入驻成功！',
        icon: 'success'
      });
      setTimeout(function () {
        _tarojs_taro__WEBPACK_IMPORTED_MODULE_4___default().switchTab({
          url: '/pages/workbench/index'
        });
      }, 1500);
    }, 1500);
  };

  // ============================================
  // Rendering
  // ============================================
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
    className: "onboarding-page",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "step-header",
      children: [steps.map(function (step, idx) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "step-item ".concat(currentStep === idx ? 'active' : '', " ").concat(currentStep > idx ? 'completed' : ''),
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "circle",
            children: currentStep > idx ? '✓' : idx + 1
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: step
          })]
        }, idx);
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "progress-line",
        style: {
          width: "".concat(currentStep / (steps.length - 1) * 100, "%")
        }
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.ScrollView, {
      scrollY: true,
      className: "content-scroll",
      children: [currentStep === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "step-content",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "title",
            children: "L2C\u5E73\u53F0\u5E08\u5085\u670D\u52A1\u884C\u4E3A\u89C4\u8303"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "rich-text",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7B2C\u4E00\u6761 \u672C\u89C4\u8303\u9002\u7528\u4E8E\u6240\u6709\u5E73\u53F0\u5165\u9A7B\u5B89\u88C5\u3001\u91CF\u5C3A\u5E08\u5085\u3002"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7B2C\u4E8C\u6761 \u63A5\u5355\u540E\u9700\u57281\u5C0F\u65F6\u5185\u8054\u7CFB\u5BA2\u6237\u786E\u8BA4\u4E0A\u95E8\u65F6\u95F4\u3002"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7B2C\u4E09\u6761 \u5165\u6237\u5FC5\u987B\u7A7F\u6234\u7EDD\u7F18\u978B\u5957\uFF0C\u5E76\u94FA\u8BBE\u65BD\u5DE5\u4FDD\u62A4\u57AB\u3002"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7B2C\u56DB\u6761 \u4E25\u7981\u5728\u5BA2\u6237\u5BB6\u4E2D\u5438\u70DF\u3001\u5927\u58F0\u55A7\u54D7\u3001\u7D22\u8981\u989D\u5916\u5C0F\u8D39\u3002"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7B2C\u4E94\u6761 \u65BD\u5DE5\u5B8C\u6BD5\u540E\u5FC5\u987B\u6E05\u7406\u73B0\u573A\uFF0C\u9080\u7EA6\u5BA2\u6237\u8FDB\u884C\u7EBF\u4E0A\u9A8C\u6536\u3002"
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "action-area",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.CheckboxGroup, {
            onChange: function onChange(e) {
              return setAgreedSpecs(e.detail.value.length > 0);
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Checkbox, {
              value: "agree",
              checked: agreedSpecs,
              color: "#007AFF",
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "checkbox-label",
                children: "\u6211\u5DF2\u4ED4\u7EC6\u9605\u8BFB\u5E76\u627F\u8BFA\u9075\u5B88\u4E0A\u8FF0\u670D\u52A1\u89C4\u8303"
              })
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "next-btn ".concat(agreedSpecs ? 'active' : ''),
            disabled: !agreedSpecs,
            onClick: function onClick() {
              return setCurrentStep(1);
            },
            children: "\u4E0B\u4E00\u6B65"
          })]
        })]
      }), currentStep === 1 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "step-content",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "title",
            children: "\u627F\u63FD\u5408\u4F5C\u534F\u8BAE"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "rich-text",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7532\u65B9\uFF1AL2C\u7CFB\u7EDF\u5E73\u53F0\u670D\u52A1\u5546"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: ["\u4E59\u65B9\uFF1A", (userInfo === null || userInfo === void 0 ? void 0 : userInfo.name) || '王师傅', " (\u8EAB\u4EFD\u8BC1\u53F7\uFF1A***)"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "\u7ECF\u7532\u4E59\u53CC\u65B9\u53CB\u597D\u534F\u5546\uFF0C\u5C31\u5E73\u53F0\u63A5\u5355\u627F\u63FD\u670D\u52A1\u8FBE\u6210\u5982\u4E0B\u534F\u8BAE..."
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "1. \u4E59\u65B9\u4F5C\u4E3A\u72EC\u7ACB\u627F\u63FD\u4EBA\u627F\u62C5\u76F8\u5173\u8D23\u4EFB\u3002"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "para",
              children: "2. \u7ED3\u7B97\u91D1\u989D\u6309\u5E73\u53F0\u8BA2\u5355\u5C55\u793A\u4E3A\u51C6\uFF0C\u6309\u6708\u7ED3\u7B97\u3002"
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "signature-area",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "label",
            children: "\u4E59\u65B9\u843D\u6B3E\u7B7E\u5B57\uFF1A"
          }), signatureUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "signed-preview",
            onClick: openSignModal,
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Image, {
              src: signatureUrl,
              mode: "aspectFit",
              className: "sign-img"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              className: "re-sign",
              children: "\u91CD\u65B0\u7B7E\u5B57"
            })]
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
            className: "unsign-box",
            onClick: openSignModal,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
              children: "\u70B9\u51FB\u6B64\u5904\u8FDB\u884C\u624B\u5199\u7B7E\u5B57"
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "action-area double",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "prev-btn",
            onClick: function onClick() {
              return setCurrentStep(0);
            },
            children: "\u4E0A\u4E00\u6B65"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "next-btn ".concat(signatureUrl ? 'active' : ''),
            disabled: !signatureUrl,
            onClick: function onClick() {
              return setCurrentStep(2);
            },
            children: "\u4E0B\u4E00\u6B65"
          })]
        })]
      }), currentStep === 2 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "step-content",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "exam-card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "title",
            children: "\u5165\u9A7B\u6280\u80FD\u8003\u6838"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "subtitle",
            children: "\u5B8C\u6210\u4EE5\u4E0B\u95EE\u7B54\uFF0C\u5168\u90E8\u6B63\u786E\u5373\u53EF\u5165\u9A7B\u63A5\u5355"
          }), examData.map(function (q, qIndex) {
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
              className: "question-item",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                className: "question-title",
                children: [qIndex + 1, ". ", q.title]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                className: "options",
                children: q.options.map(function (opt, oIdx) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                    className: "option ".concat(answers[q.id] === oIdx ? 'selected' : ''),
                    onClick: function onClick() {
                      return handleSelectAnswer(q.id, oIdx);
                    },
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                      className: "radio-circle",
                      children: answers[q.id] === oIdx && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
                        className: "inner"
                      })
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
                      className: "opt-text",
                      children: opt
                    })]
                  }, oIdx);
                })
              })]
            }, q.id);
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "action-area double",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "prev-btn",
            onClick: function onClick() {
              return setCurrentStep(1);
            },
            children: "\u4E0A\u4E00\u6B65"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "next-btn ".concat(Object.keys(answers).length === examData.length ? 'active' : ''),
            disabled: Object.keys(answers).length < examData.length,
            onClick: submitOnboarding,
            children: "\u9A6C\u4E0A\u63D0\u4EA4"
          })]
        })]
      })]
    }), showSignModal && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
      className: "sign-modal",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
        className: "modal-content",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "modal-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "modal-title",
            children: "\u8BF7\u5728\u4E0B\u65B9\u7A7A\u767D\u5904\u624B\u5199\u7B7E\u5B57"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Text, {
            className: "close-btn",
            onClick: function onClick() {
              return setShowSignModal(false);
            },
            children: "\xD7"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "canvas-container",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Canvas, {
            type: "2d",
            id: "workerSignCanvas",
            className: "sign-canvas",
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.View, {
          className: "modal-footer",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "clear-btn",
            onClick: clearCanvas,
            children: "\u6E05\u9664\u91CD\u5199"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_tarojs_components__WEBPACK_IMPORTED_MODULE_3__.Button, {
            className: "confirm-btn",
            onClick: confirmSignature,
            children: "\u786E\u8BA4\u7B7E\u540D"
          })]
        })]
      })
    })]
  });
}

/***/ }),

/***/ "./src/packageWorker/onboarding/index.tsx":
/*!************************************************!*\
  !*** ./src/packageWorker/onboarding/index.tsx ***!
  \************************************************/
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @tarojs/runtime */ "webpack/container/remote/@tarojs/runtime");
/* harmony import */ var _tarojs_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/onboarding/index!./index.tsx */ "./node_modules/@tarojs/taro-loader/lib/entry-cache.js?name=packageWorker/onboarding/index!./src/packageWorker/onboarding/index.tsx");


var config = {"navigationBarTitleText":"入驻培训及签约","backgroundColor":"#F2F2F7","disableScroll":true};



var taroOption = (0,_tarojs_runtime__WEBPACK_IMPORTED_MODULE_0__.createPageConfig)(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"], 'packageWorker/onboarding/index', {root:{cn:[]}}, config || {})
if (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"] && _node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors) {
  taroOption.behaviors = (taroOption.behaviors || []).concat(_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"].behaviors)
}
var inst = Page(taroOption)



/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_tarojs_taro_loader_lib_entry_cache_js_name_packageWorker_onboarding_index_index_tsx__WEBPACK_IMPORTED_MODULE_1__["default"]);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
/******/ __webpack_require__.O(0, ["taro","vendors","common"], function() { return __webpack_exec__("./src/packageWorker/onboarding/index.tsx"); });
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ }
]);
//# sourceMappingURL=index.js.map