import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Partnerships from './Partnerships';
import Customers from './Customers';
import Products from './Products';
import RequestForms from './RequestForms';
import ProjectReferences from './ProjectReferences';
import News from './News';
import Articles from './Articles';
import ArticleEditor from './ArticleEditor';

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/partnerships" replace />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/request-forms" element={<RequestForms />} />
            <Route path="/project-references" element={<ProjectReferences />} />
            <Route path="/news" element={<News />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/edit/:id" element={<ArticleEditor />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;