'use client';

import { useState } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import PaperCard from '@/components/ui/paper-card';
import PaperTable from '@/components/ui/paper-table';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modifiedTime: string;
  owner: string;
  shared: boolean;
  shareCount?: number;
  tags: string[];
  url?: string;
}

interface ShareRecord {
  id: string;
  fileName: string;
  sharedWith: string;
  permission: 'view' | 'edit' | 'download';
  shareTime: string;
  expireTime?: string;
  status: 'active' | 'expired' | 'revoked';
}

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState('files');
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedShare, setSelectedShare] = useState<ShareRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'owner'>('date');

  // Mock data
  const files: FileItem[] = [
    {
      id: '1',
      name: '2024年度销售报告.pdf',
      type: 'file',
      size: '2.5MB',
      modifiedTime: '2024-01-15 14:30',
      owner: '张三',
      shared: true,
      shareCount: 5,
      tags: ['销售', '报告', '2024'],
      url: '#'
    },
    {
      id: '2',
      name: '客户合同模板',
      type: 'folder',
      modifiedTime: '2024-01-14 16:45',
      owner: '李四',
      shared: false,
      tags: ['合同', '模板'],
      url: '#'
    },
    {
      id: '3',
      name: '产品图片素材',
      type: 'folder',
      modifiedTime: '2024-01-13 11:20',
      owner: '王五',
      shared: true,
      shareCount: 12,
      tags: ['产品', '图片', '素材'],
      url: '#'
    },
    {
      id: '4',
      name: '财务预算表.xlsx',
      type: 'file',
      size: '1.8MB',
      modifiedTime: '2024-01-12 09:15',
      owner: '赵六',
      shared: false,
      tags: ['财务', '预算'],
      url: '#'
    },
    {
      id: '5',
      name: '会议纪要.docx',
      type: 'file',
      size: '856KB',
      modifiedTime: '2024-01-11 15:30',
      owner: '钱七',
      shared: true,
      shareCount: 3,
      tags: ['会议', '纪要'],
      url: '#'
    }
  ];

  const shareRecords: ShareRecord[] = [
    {
      id: '1',
      fileName: '2024年度销售报告.pdf',
      sharedWith: '销售团队',
      permission: 'view',
      shareTime: '2024-01-15 15:00',
      expireTime: '2024-02-15 15:00',
      status: 'active'
    },
    {
      id: '2',
      fileName: '产品图片素材',
      sharedWith: '设计部门',
      permission: 'edit',
      shareTime: '2024-01-14 10:30',
      status: 'active'
    },
    {
      id: '3',
      fileName: '会议纪要.docx',
      sharedWith: '项目组',
      permission: 'download',
      shareTime: '2024-01-11 16:00',
      expireTime: '2024-01-18 16:00',
      status: 'expired'
    }
  ];

  const folderPath = [
    { name: '根目录', path: '/' },
    { name: '文档', path: '/documents' },
    { name: '销售资料', path: '/documents/sales' }
  ];

  const tabs = [
    { id: 'files', label: '我的文件', count: files.length },
    { id: 'shared', label: '共享记录', count: shareRecords.length },
    { id: 'recent', label: '最近使用', count: 8 },
    { id: 'trash', label: '回收站', count: 3 }
  ];

  const getFileIcon = (type: string, name: string) => {
    if (type === 'folder') {
      return (
        <svg className="w-5 h-5 text-paper-warning" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }
    
    const extension = name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <svg className="w-5 h-5 text-paper-error" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 2 2-4 3 6z" /></svg>;
      case 'xlsx':
      case 'xls':
        return <svg className="w-5 h-5 text-paper-success" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 2 2-4 3 6z" /></svg>;
      case 'docx':
      case 'doc':
        return <svg className="w-5 h-5 text-paper-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 2 2-4 3 6z" /></svg>;
      default:
        return <svg className="w-5 h-5 text-paper-ink-secondary" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 2 2-4 3 6z" /></svg>;
    }
  };

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'view': return '查看';
      case 'edit': return '编辑';
      case 'download': return '下载';
      default: return permission;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '有效';
      case 'expired': return '已过期';
      case 'revoked': return '已撤销';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-paper-success-light text-paper-success';
      case 'expired': return 'bg-paper-error-light text-paper-error';
      case 'revoked': return 'bg-paper-warning-light text-paper-warning';
      default: return 'bg-paper-ink-light text-paper-ink';
    }
  };

  const renderFileManager = () => (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <PaperButton>上传文件</PaperButton>
          <PaperButton variant="outline">新建文件夹</PaperButton>
          <PaperButton variant="outline">批量操作</PaperButton>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'owner')}
            className="paper-input px-3 py-2 text-sm"
          >
            <option value="date">按时间排序</option>
            <option value="name">按名称排序</option>
            <option value="size">按大小排序</option>
            <option value="owner">按所有者排序</option>
          </select>
          <div className="flex border border-paper-border rounded-lg overflow-hidden">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-paper-primary text-white' : 'bg-white text-paper-ink'}`}
            >
              列表
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-paper-primary text-white' : 'bg-white text-paper-ink'}`}
            >
              网格
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-paper-ink-secondary">
        {folderPath.map((path, index) => (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && <span className="text-paper-ink-light">/</span>}
            <button 
              onClick={() => setCurrentPath(path.path)}
              className="hover:text-paper-primary transition-colors"
            >
              {path.name}
            </button>
          </div>
        ))}
        <span className="ml-3 text-paper-ink">当前路径：{currentPath}</span>
      </div>

      {/* File List */}
      {viewMode === 'list' ? (
        <PaperTable>
          <PaperTable.Header>
            <PaperTable.HeaderCell>名称</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>大小</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>修改时间</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>所有者</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>标签</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>共享状态</PaperTable.HeaderCell>
            <PaperTable.HeaderCell>操作</PaperTable.HeaderCell>
          </PaperTable.Header>
          <PaperTable.Body>
            {files.map((file) => (
              <PaperTable.Row key={file.id}>
                <PaperTable.Cell>
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type, file.name)}
                    <div>
                      <div className="font-medium text-paper-ink">{file.name}</div>
                      {file.type === 'file' && file.url && (
                        <a href={file.url} className="text-sm text-paper-primary hover:underline">
                          下载
                        </a>
                      )}
                    </div>
                  </div>
                </PaperTable.Cell>
                <PaperTable.Cell>{file.size || '-'}</PaperTable.Cell>
                <PaperTable.Cell>{file.modifiedTime}</PaperTable.Cell>
                <PaperTable.Cell>{file.owner}</PaperTable.Cell>
                <PaperTable.Cell>
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-paper-primary-light text-paper-primary rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </PaperTable.Cell>
                <PaperTable.Cell>
                  <div className="flex items-center space-x-2">
                    {file.shared ? (
                      <>
                        <span className="w-2 h-2 bg-paper-success rounded-full"></span>
                        <span className="text-sm text-paper-success">已共享</span>
                        {file.shareCount && (
                          <span className="px-1 py-0.5 bg-paper-success-light text-paper-success rounded text-xs">
                            {file.shareCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-paper-ink-light rounded-full"></span>
                        <span className="text-sm text-paper-ink-secondary">私有</span>
                      </>
                    )}
                  </div>
                </PaperTable.Cell>
                <PaperTable.Cell>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedFile(file)}
                      className="text-paper-primary hover:text-paper-primary-dark text-sm"
                    >
                      详情
                    </button>
                    <button className="text-paper-warning hover:text-paper-warning-dark text-sm">
                      重命名
                    </button>
                    <button className="text-paper-info hover:text-paper-info-dark text-sm">
                      分享
                    </button>
                    <button className="text-paper-error hover:text-paper-error-dark text-sm">
                      删除
                    </button>
                  </div>
                </PaperTable.Cell>
              </PaperTable.Row>
            ))}
          </PaperTable.Body>
        </PaperTable>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <PaperCard key={file.id} className="hover:shadow-paper-lg transition-shadow cursor-pointer">
              <PaperCard.Content className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-paper-ink text-sm truncate max-w-full">
                      {file.name}
                    </div>
                    <div className="text-xs text-paper-ink-secondary mt-1">
                      {file.modifiedTime}
                    </div>
                  </div>
                  {file.shared && (
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-paper-success rounded-full"></span>
                      <span className="text-xs text-paper-success">已共享</span>
                    </div>
                  )}
                </div>
              </PaperCard.Content>
              <PaperCard.Footer className="p-3">
                <div className="flex justify-between">
                  <button 
                    onClick={() => setSelectedFile(file)}
                    className="text-paper-primary hover:text-paper-primary-dark text-xs"
                  >
                    详情
                  </button>
                  <div className="flex space-x-2">
                    <button className="text-paper-info hover:text-paper-info-dark text-xs">
                      分享
                    </button>
                    <button className="text-paper-error hover:text-paper-error-dark text-xs">
                      删除
                    </button>
                  </div>
                </div>
              </PaperCard.Footer>
            </PaperCard>
          ))}
        </div>
      )}

      {/* File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <PaperCard.Header>
              <PaperCard.Title>文件详情</PaperCard.Title>
            </PaperCard.Header>
            <PaperCard.Content>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-paper-primary-light rounded-lg">
                    {getFileIcon(selectedFile.type, selectedFile.name)}
                  </div>
                  <div>
                    <h3 className="font-medium text-paper-ink">{selectedFile.name}</h3>
                    <p className="text-sm text-paper-ink-secondary">
                      {selectedFile.type === 'file' ? `文件大小: ${selectedFile.size}` : '文件夹'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">所有者</label>
                    <p className="text-paper-ink">{selectedFile.owner}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">修改时间</label>
                    <p className="text-paper-ink">{selectedFile.modifiedTime}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">共享状态</label>
                    <p className="text-paper-ink">{selectedFile.shared ? '已共享' : '私有'}</p>
                  </div>
                  {selectedFile.shareCount && (
                    <div>
                      <label className="block text-sm font-medium text-paper-ink-secondary mb-1">共享次数</label>
                      <p className="text-paper-ink">{selectedFile.shareCount} 次</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-2">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedFile.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-paper-primary-light text-paper-primary rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </PaperCard.Content>
            <PaperCard.Footer>
              <div className="flex justify-between">
                <div className="flex space-x-3">
                  <PaperButton variant="outline" onClick={() => setSelectedFile(null)}>关闭</PaperButton>
                  {selectedFile.url && (
                    <PaperButton>
                      <a href={selectedFile.url} className="text-white hover:text-white">
                        下载
                      </a>
                    </PaperButton>
                  )}
                </div>
                <div className="flex space-x-3">
                  <PaperButton variant="outline">重命名</PaperButton>
                  <PaperButton>分享</PaperButton>
                </div>
              </div>
            </PaperCard.Footer>
          </PaperCard>
        </div>
      )}
    </div>
  );

  const renderShareRecords = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">共享记录</h2>
        <PaperButton>新建共享</PaperButton>
      </div>

      <PaperTable>
        <PaperTable.Header>
          <PaperTable.HeaderCell>文件名称</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>共享给</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>权限</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>共享时间</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>过期时间</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>状态</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>操作</PaperTable.HeaderCell>
        </PaperTable.Header>
        <PaperTable.Body>
          {shareRecords.map((record) => (
            <PaperTable.Row key={record.id}>
              <PaperTable.Cell className="font-medium">{record.fileName}</PaperTable.Cell>
              <PaperTable.Cell>{record.sharedWith}</PaperTable.Cell>
              <PaperTable.Cell>
                <span className="px-2 py-1 bg-paper-info-light text-paper-info rounded text-xs">
                  {getPermissionText(record.permission)}
                </span>
              </PaperTable.Cell>
              <PaperTable.Cell>{record.shareTime}</PaperTable.Cell>
              <PaperTable.Cell>{record.expireTime || '-'}</PaperTable.Cell>
              <PaperTable.Cell>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                  {getStatusText(record.status)}
                </span>
              </PaperTable.Cell>
              <PaperTable.Cell>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedShare(record)}
                    className="text-paper-primary hover:text-paper-primary-dark text-sm"
                  >
                    详情
                  </button>
                  <button className="text-paper-warning hover:text-paper-warning-dark text-sm">
                    编辑
                  </button>
                  <button className="text-paper-error hover:text-paper-error-dark text-sm">
                    撤销
                  </button>
                </div>
              </PaperTable.Cell>
            </PaperTable.Row>
          ))}
        </PaperTable.Body>
      </PaperTable>

      {/* Share Details Modal */}
      {selectedShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PaperCard className="w-full max-w-lg">
            <PaperCard.Header>
              <PaperCard.Title>共享详情</PaperCard.Title>
            </PaperCard.Header>
            <PaperCard.Content>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">文件名称</label>
                  <p className="text-paper-ink">{selectedShare.fileName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">共享给</label>
                  <p className="text-paper-ink">{selectedShare.sharedWith}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">权限</label>
                  <p className="text-paper-ink">{getPermissionText(selectedShare.permission)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">共享时间</label>
                  <p className="text-paper-ink">{selectedShare.shareTime}</p>
                </div>
                {selectedShare.expireTime && (
                  <div>
                    <label className="block text-sm font-medium text-paper-ink-secondary mb-1">过期时间</label>
                    <p className="text-paper-ink">{selectedShare.expireTime}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">状态</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedShare.status)}`}>
                    {getStatusText(selectedShare.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-paper-ink-secondary mb-1">共享链接</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value="https://example.com/share/abc123" 
                      readOnly 
                      className="paper-input flex-1 text-sm"
                    />
                    <PaperButton size="sm">复制</PaperButton>
                  </div>
                </div>
              </div>
            </PaperCard.Content>
            <PaperCard.Footer>
              <div className="flex justify-between">
                <PaperButton variant="outline" onClick={() => setSelectedShare(null)}>关闭</PaperButton>
                <div className="flex space-x-3">
                  <PaperButton variant="outline">编辑权限</PaperButton>
                  <PaperButton>撤销共享</PaperButton>
                </div>
              </div>
            </PaperCard.Footer>
          </PaperCard>
        </div>
      )}
    </div>
  );

  const renderRecentFiles = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-paper-ink">最近使用</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.slice(0, 4).map((file) => (
          <PaperCard key={file.id} className="hover:shadow-paper-lg transition-shadow cursor-pointer">
            <PaperCard.Content className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                {getFileIcon(file.type, file.name)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-paper-ink text-sm truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-paper-ink-secondary">
                    {file.modifiedTime}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-paper-ink-secondary">{file.owner}</span>
                {file.shared && (
                  <span className="w-1.5 h-1.5 bg-paper-success rounded-full"></span>
                )}
              </div>
            </PaperCard.Content>
          </PaperCard>
        ))}
      </div>
    </div>
  );

  const renderTrash = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-paper-ink">回收站</h2>
        <div className="flex space-x-3">
          <PaperButton variant="outline">清空回收站</PaperButton>
          <PaperButton>还原全部</PaperButton>
        </div>
      </div>

      <div className="bg-paper-warning-light border border-paper-warning rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-paper-warning" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-paper-warning">回收站中的文件将在30天后自动删除</span>
        </div>
      </div>

      <PaperTable>
        <PaperTable.Header>
          <PaperTable.HeaderCell>名称</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>删除时间</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>原位置</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>大小</PaperTable.HeaderCell>
          <PaperTable.HeaderCell>操作</PaperTable.HeaderCell>
        </PaperTable.Header>
        <PaperTable.Body>
          {files.slice(0, 3).map((file) => (
            <PaperTable.Row key={file.id} className="opacity-75">
              <PaperTable.Cell>
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type, file.name)}
                  <span className="text-paper-ink">{file.name}</span>
                </div>
              </PaperTable.Cell>
              <PaperTable.Cell>2024-01-10 14:30</PaperTable.Cell>
              <PaperTable.Cell>/文档/销售资料</PaperTable.Cell>
              <PaperTable.Cell>{file.size || '-'}</PaperTable.Cell>
              <PaperTable.Cell>
                <div className="flex space-x-2">
                  <button className="text-paper-primary hover:text-paper-primary-dark text-sm">
                    还原
                  </button>
                  <button className="text-paper-error hover:text-paper-error-dark text-sm">
                    永久删除
                  </button>
                </div>
              </PaperTable.Cell>
            </PaperTable.Row>
          ))}
        </PaperTable.Body>
      </PaperTable>
    </div>
  );

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-paper-ink mb-2">文件管理</h1>
          <p className="text-paper-ink-secondary">管理您的文件和共享内容</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-paper-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-paper-primary text-paper-primary'
                    : 'border-transparent text-paper-ink-secondary hover:text-paper-ink'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-paper-primary-light text-paper-primary px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'files' && renderFileManager()}
          {activeTab === 'shared' && renderShareRecords()}
          {activeTab === 'recent' && renderRecentFiles()}
          {activeTab === 'trash' && renderTrash()}
        </div>
      </div>
  );
}
