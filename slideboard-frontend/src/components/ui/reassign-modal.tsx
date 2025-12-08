'use client';

import React, { useState, useMemo } from 'react';

import { PaperButton } from './paper-button';
import { PaperInput } from './paper-input';
import { PaperModal } from './paper-modal';
import { toast } from './toast';

interface User {
  id: string;
  name: string;
  role?: string;
  [key: string]: unknown;
}

interface ReassignModalProps<T extends { id: string }> {
  isOpen: boolean;
  onClose: () => void;
  items: T[];
  users: User[];
  onReassign: (itemIds: string[], userId: string) => void;
  getDisplayName?: (item: T) => string;
  title?: string;
  itemType?: string;
}

export const ReassignModal = <T extends { id: string }>({
  isOpen,
  onClose,
  items,
  users,
  onReassign,
  getDisplayName = (item) => item.id,
  title = '重新分配',
  itemType = '项目'
}: ReassignModalProps<T>) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      (user.role && user.role.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const handleReassign = () => {
    if (!selectedUserId) {
      toast.error(`请选择要分配给的${itemType === '项目' ? '用户' : itemType}`);
      return;
    }

    const itemIds = items.map(item => item.id);
    onReassign(itemIds, selectedUserId);
    toast.success(`${itemType}已成功重新分配`);
    onClose();
  };

  return (
    <PaperModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Items to Reassign */}
        <div>
          <h3 className="text-sm font-medium text-ink-600 mb-2">待重新分配的{itemType}</h3>
          <div className="bg-paper-100 p-4 rounded-lg max-h-40 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="text-sm text-ink-700 py-1">
                • {getDisplayName(item)}
              </div>
            ))}
          </div>
        </div>

        {/* User Search */}
        <div>
          <h3 className="text-sm font-medium text-ink-600 mb-2">查找用户</h3>
          <PaperInput
            type="text"
            placeholder="搜索用户名或角色"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
        </div>

        {/* User Selection */}
        <div>
          <h3 className="text-sm font-medium text-ink-600 mb-2">选择新负责人</h3>
          <div className="border border-paper-600 rounded-lg max-h-60 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-ink-500">
                未找到匹配的用户
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer hover:bg-paper-100 ${selectedUserId === user.id ? 'bg-paper-200' : ''}`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink-800">{user.name}</div>
                        <div className="text-xs text-ink-500">
                          {user.role && <span>{user.role}</span>}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${selectedUserId === user.id ? 'border-blue-600 bg-blue-600' : 'border-paper-600'}`}>
                        {selectedUserId === user.id && (
                          <div className="w-2 h-2 rounded-full bg-white mx-auto my-auto"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-paper-600">
          <PaperButton variant="outline" onClick={onClose}>
            取消
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={handleReassign}
            disabled={!selectedUserId}
          >
            确认重新分配
          </PaperButton>
        </div>
      </div>
    </PaperModal>
  );
};
