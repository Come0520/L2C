/**
 * 空状态组件
 * 替代 533KB 的 empty.png，使用轻量 SVG
 */
Component({
    properties: {
        /** 空状态提示文字 */
        text: {
            type: String,
            value: '暂无数据'
        }
    }
});
