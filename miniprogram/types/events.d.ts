/**
 * 微信小程序事件类型别名
 * 用于替代业务代码中散落的 `e: any` 声明
 */

/** 通用触摸事件 */
type WxTouchEvent = WechatMiniprogram.TouchEvent;

/** 自定义事件（带泛型详情） */
type WxCustomEvent<T = Record<string, unknown>> = WechatMiniprogram.CustomEvent<T>;

/** 表单输入事件 */
type WxInputEvent = WechatMiniprogram.Input;

/** Picker 选择器变更事件 */
type WxPickerChangeEvent = WechatMiniprogram.PickerChange;

/** Switch 开关变更事件 */
type WxSwitchChangeEvent = WechatMiniprogram.SwitchChange;

/** 页面 onLoad 参数 */
type WxPageOptions = Record<string, string | undefined>;

export { };
