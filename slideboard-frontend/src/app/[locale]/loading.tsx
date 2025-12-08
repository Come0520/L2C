export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* 加载动画 */}
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        
        {/* 加载文本 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">加载中...</h2>
        <p className="text-gray-600">请稍候，正在为您准备内容</p>
        
        {/* 进度指示器（可选） */}
        <div className="mt-6 max-w-sm mx-auto">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-600 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">60% 完成</p>
        </div>
      </div>
    </div>
  );
}