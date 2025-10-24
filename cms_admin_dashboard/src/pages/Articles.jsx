import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiService } from '../services/api';
import { PlusIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

const Articles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);

  // Get media base URL
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const mediaBase = apiBase.replace('/api', '');

  // Helper function to extract plain text preview from content
  const getContentPreview = (articleItem) => {
    // Check for HTML content first
    if (articleItem.content_html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = articleItem.content_html;
      const text = tmp.textContent || tmp.innerText || '';
      return text.slice(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    // Fallback to Slate JSON content
    if (articleItem.content && articleItem.content.content && Array.isArray(articleItem.content.content)) {
      const text = articleItem.content.content.map(node => 
        node.children?.map(child => child.text).join('') || ''
      ).join(' ');
      return text.slice(0, 100) + (text.length > 100 ? '...' : '');
    }
    
    return 'No content available';
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.articles.getAll();
      setArticles(response.data);
    } catch (err) {
      setError('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await adminApiService.articles.delete(id);
        fetchArticles();
      } catch (err) {
        setError('Failed to delete article');
      }
    }
  };

  const handlePreview = (article) => {
    setPreviewArticle(article);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Articles</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/articles/upload')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Article</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Articles Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Images
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.map((articleItem) => (
              <tr key={articleItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {articleItem.article_title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {getContentPreview(articleItem)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {articleItem.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {articleItem.article_image && articleItem.article_image.length > 0 ? (
                    <div className="flex space-x-1">
                      {articleItem.article_image.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={typeof image === 'string' ? image : image.data_url}
                          alt={`Article ${index + 1}`}
                          className="w-10 h-10 object-cover rounded border"
                        />
                      ))}
                      {articleItem.article_image.length > 3 && (
                        <span className="text-xs text-gray-500 self-center">+{articleItem.article_image.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No images</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(articleItem.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handlePreview(articleItem)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Preview"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(articleItem.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Article Preview: {previewArticle.article_title}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {previewArticle.category || 'Uncategorized'}
                </span>
              </div>
              <div 
                dangerouslySetInnerHTML={{ __html: previewArticle.content_html }}
                className="prose max-w-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;