'use client';

import { useState } from 'react';
import { Menu, X, User, Settings, LogOut, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_error) {
      return;
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="text-2xl font-bold text-primary-600 hover:text-primary-700"
            >
              Slideboard
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => router.push('/')}
              className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              我的幻灯片
            </button>
            <button
              onClick={() => router.push('/collaborate')}
              className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              协作空间
            </button>
            <button
              onClick={() => router.push('/team')}
              className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
            >
              团队
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Create button */}
            <button
              onClick={() => router.push('/editor/new')}
              className="hidden md:inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.name}
                </span>
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => handleNavigation('/profile')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <User className="h-4 w-4 mr-3" />
                    个人中心
                  </button>
                  <button
                    onClick={() => handleNavigation('/settings')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    设置
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    退出登录
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleNavigation('/')}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 w-full text-left"
              >
                我的幻灯片
              </button>
              <button
                onClick={() => handleNavigation('/collaborate')}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 w-full text-left"
              >
                协作空间
              </button>
              <button
                onClick={() => handleNavigation('/team')}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 w-full text-left"
              >
                团队
              </button>
              <hr className="my-2" />
              <button
                onClick={() => router.push('/editor/new')}
                className="flex items-center px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md w-full"
              >
                <Plus className="h-5 w-5 mr-2" />
                新建幻灯片
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
