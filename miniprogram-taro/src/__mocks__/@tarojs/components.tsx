/**
 * @tarojs/components Mock
 *
 * @description 将 Taro 组件映射为简单的 HTML 元素，使 React Testing Library 可以正常渲染和查询。
 */
import * as React from 'react'

/** 通用组件工厂 — 不使用 forwardRef 以保持兼容性 */
function createMockComponent(tagName: string) {
    return function MockComponent({ children, className, ...rest }: any) {
        return React.createElement(tagName, { className, ...rest }, children)
    }
}

export const View = createMockComponent('div')
export const Text = createMockComponent('span')
export const ScrollView = createMockComponent('div')
export const Swiper = createMockComponent('div')
export const SwiperItem = createMockComponent('div')
export const Button = createMockComponent('button')
export const Form = createMockComponent('form')
export const Label = createMockComponent('label')
export const Navigator = createMockComponent('a')
export const Video = createMockComponent('video')
export const Canvas = createMockComponent('canvas')
export const WebView = createMockComponent('iframe')

export function Image({ className, src, mode, lazyLoad, ...rest }: any) {
    return React.createElement('img', { className, src, ...rest })
}

export function Input({ className, value, onInput, onConfirm, placeholder, ...rest }: any) {
    return React.createElement('input', {
        className,
        value,
        placeholder,
        onChange: (e: any) => onInput?.({ detail: { value: e.target.value } }),
        onKeyDown: (e: any) => { if (e.key === 'Enter') onConfirm?.({ detail: { value: e.target.value } }) },
        ...rest,
    })
}

export function Textarea({ className, value, onInput, placeholder, ...rest }: any) {
    return React.createElement('textarea', {
        className,
        value,
        placeholder,
        onChange: (e: any) => onInput?.({ detail: { value: e.target.value } }),
        ...rest,
    })
}

export const Picker = createMockComponent('select')
export const Switch = createMockComponent('input')
export const Checkbox = createMockComponent('input')
export const Radio = createMockComponent('input')
