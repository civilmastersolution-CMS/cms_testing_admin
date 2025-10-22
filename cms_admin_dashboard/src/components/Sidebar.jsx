import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UsersIcon,
  BuildingOfficeIcon,
  CubeIcon,
  DocumentTextIcon,
  PhotoIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Partnerships', href: '/partnerships', icon: UsersIcon },
    { name: 'Customers', href: '/customers', icon: BuildingOfficeIcon },
    { name: 'Products', href: '/products', icon: CubeIcon },
    { name: 'Request Forms', href: '/request-forms', icon: DocumentTextIcon },
    { name: 'Project References', href: '/project-references', icon: PhotoIcon },
    { name: 'News', href: '/news', icon: NewspaperIcon },
    { name: 'Articles', href: '/articles', icon: DocumentTextIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CMS Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive 
                  ? 'bg-cyan-100 text-cyan-700 border-r-2 border-cyan-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon 
                className={`
                  mr-3 h-5 w-5 transition-colors
                  ${isActive ? 'text-cyan-700' : 'text-gray-400 group-hover:text-gray-500'}
                `} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;