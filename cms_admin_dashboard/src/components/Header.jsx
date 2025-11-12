import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, SignalIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const testBackendConnection = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const testUrl = apiUrl.replace('/api', '') + '/articles/';
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      alert(`✅ Backend Connected Successfully!\n\nURL: ${testUrl}\nStatus: ${response.status}\nArticles found: ${data.length || 0}`);
    } catch (error) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const testUrl = apiUrl.replace('/api', '') + '/articles/';
      
      alert(`❌ Backend Connection Failed!\n\nURL: ${testUrl}\nError: ${error.message}\n\nPlease check:\n1. Backend server is running\n2. VITE_API_URL is correct\n3. Network connection`);
    }
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
          {/* Connection Test Button */}
          <button
            onClick={testBackendConnection}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Test Backend Connection"
          >
            <SignalIcon className="w-4 h-4" />
            <span>Test API</span>
          </button>

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