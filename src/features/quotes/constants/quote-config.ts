/**
 * 报价配置相关静态常量
 *
 * 从 `quote-config-dialog.tsx` 中抽离，集中管理报价系统的
 * 可配置字段列表和 BOM 联动预设模板。
 */
import { type LinkageRule } from '@/services/quote-config.service';

/** 可在报价单中显示/隐藏的字段列表 */
export const AVAILABLE_FIELDS = [
  { id: 'foldRatio', label: '褶皱倍数' },
  { id: 'processFee', label: '加工费' },
  { id: 'remark', label: '备注' },
  { id: 'measuredWidth', label: '实测宽' },
  { id: 'measuredHeight', label: '实测高' },
  { id: 'fabricWidth', label: '面料幅宽' },
  { id: 'installMethod', label: '安装方式 (明/暗装)' },
  { id: 'openingStyle', label: '打开方式 (单/双开)' },
];

/**
 * BOM 预设模板中单个组件的配置
 */
export interface BomPresetComponent {
  /** 关联的从材类别 */
  targetCategory: string;
  /** 显示名称 */
  label: string;
  /** 描述 */
  description: string;
  /** 默认计算逻辑 */
  defaultCalcLogic: LinkageRule['calcLogic'];
}

/**
 * BOM 联动预设模板：每个主材类别对应一组可选组件。
 * 用户通过开关控制添加该主材时自动带出哪些配套组件。
 */
export const BOM_PRESETS: { value: string; label: string; components: BomPresetComponent[] }[] = [
  {
    value: 'CURTAIN',
    label: '窗帘',
    components: [
      {
        targetCategory: 'CURTAIN_TRACK',
        label: '轨道',
        description: '窗帘轨道 / 滑轨 / 罗马杆',
        defaultCalcLogic: 'FINISHED_WIDTH',
      },
      {
        targetCategory: 'SERVICE',
        label: '加工费',
        description: '制作、安装、裁剪等加工费用',
        defaultCalcLogic: 'FIXED',
      },
      {
        targetCategory: 'CURTAIN_ACCESSORY',
        label: '辅料',
        description: '挂钩、绑带、铅块等',
        defaultCalcLogic: 'FIXED',
      },
    ],
  },
  {
    value: 'WALLPAPER',
    label: '墙纸',
    components: [
      {
        targetCategory: 'WALL_ACCESSORY',
        label: '辅料',
        description: '墙纸胶、基膜等',
        defaultCalcLogic: 'PROPORTIONAL',
      },
      {
        targetCategory: 'SERVICE',
        label: '施工费',
        description: '铺贴施工人工费',
        defaultCalcLogic: 'PROPORTIONAL',
      },
    ],
  },
  {
    value: 'WALLCLOTH',
    label: '墙布',
    components: [
      {
        targetCategory: 'WALLCLOTH_ACCESSORY',
        label: '辅料',
        description: '墙布胶、基膜等',
        defaultCalcLogic: 'PROPORTIONAL',
      },
      {
        targetCategory: 'SERVICE',
        label: '施工费',
        description: '铺贴施工人工费',
        defaultCalcLogic: 'PROPORTIONAL',
      },
    ],
  },
  {
    value: 'BLIND',
    label: '功能帘',
    components: [
      {
        targetCategory: 'MOTOR',
        label: '电机',
        description: '电动开合电机',
        defaultCalcLogic: 'FIXED',
      },
      {
        targetCategory: 'SERVICE',
        label: '安装费',
        description: '安装人工费',
        defaultCalcLogic: 'FIXED',
      },
    ],
  },
  {
    value: 'SOFT_PACK',
    label: '软硬包',
    components: [
      {
        targetCategory: 'SERVICE',
        label: '安装费',
        description: '安装人工费',
        defaultCalcLogic: 'FIXED',
      },
      {
        targetCategory: 'HARDWARE',
        label: '五金',
        description: '挂件、螺丝等',
        defaultCalcLogic: 'FIXED',
      },
    ],
  },
  {
    value: 'WALLPANEL',
    label: '墙咔',
    components: [
      {
        targetCategory: 'PANEL_ACCESSORY',
        label: '附件',
        description: '墙咔配套附件',
        defaultCalcLogic: 'FIXED',
      },
      {
        targetCategory: 'SERVICE',
        label: '安装费',
        description: '安装人工费',
        defaultCalcLogic: 'FIXED',
      },
    ],
  },
  {
    value: 'MATTRESS',
    label: '床垫',
    components: [
      {
        targetCategory: 'STANDARD',
        label: '配套标品',
        description: '床笺、枕头等',
        defaultCalcLogic: 'FIXED',
      },
    ],
  },
];
