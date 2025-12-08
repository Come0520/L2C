'use client';

import React from 'react';

import { MeasurementData } from '../../../../types/measurement';

interface MeasurementDataEditorProps {
  value?: MeasurementData;
  onChange: (value: Partial<MeasurementData> | MeasurementData) => void;
  error?: string;
}

/**
 * 测量数据编辑器组件
 * 用于编辑测量数据
 */
const MeasurementDataEditor: React.FC<MeasurementDataEditorProps> = ({ value, onChange, error }) => {
  return (
    <div className="measurement-data-editor border rounded p-4">
      <h3 className="text-lg font-medium mb-2">测量数据编辑器</h3>
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div className="text-gray-500 italic">
        {/* 这里应该是复杂的测量数据编辑逻辑，暂时显示简单状态 */}
        {value ? (
          <div>
            <p>总面积: {value.totalArea} m²</p>
            <p>房间数: {value.rooms?.length || 0}</p>
          </div>
        ) : (
          <p>暂无测量数据</p>
        )}
      </div>

      <button
        type="button"
        className="mt-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
        onClick={() => {
          // Mock adding data for testing
          onChange({
            totalArea: 100,
            rooms: [
              { id: '1', name: '客厅', area: 50, items: [] },
              { id: '2', name: '卧室', area: 50, items: [] }
            ]
          })
        }}
      >
        模拟填入数据
      </button>
    </div>
  );
};

export default MeasurementDataEditor;
