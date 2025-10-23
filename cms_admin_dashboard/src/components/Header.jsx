import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            CMS Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Manage your Civil Master Solution content
          </p>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-cyan-100 rounded-full">
              <UserIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.username || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;