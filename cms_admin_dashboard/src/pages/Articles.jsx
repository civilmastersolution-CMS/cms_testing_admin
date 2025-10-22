import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiService } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Articles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <button
          onClick={() => navigate('/articles/edit/new')}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Article</span>
        </button>
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
                      {articleItem.content && articleItem.content.content && Array.isArray(articleItem.content.content) 
                        ? articleItem.content.content.map(node => 
                            node.children?.map(child => child.text).join('') || ''
                          ).join(' ').slice(0, 100) + (articleItem.content.content.map(node => 
                            node.children?.map(child => child.text).join('') || ''
                          ).join(' ').length > 100 ? '...' : '')
                        : 'No content available'
                      }
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
                          src={image}
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
                    onClick={() => navigate(`/articles/edit/${articleItem.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
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
    </div>
  );
};

export default Articles;