import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    news_title: '',
    content: '',
    keyword: [],
    news_image: [],
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.news.getAll();
      setNews(response.data);
    } catch (err) {
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check word limit
    const wordCount = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 250) {
      alert('Content cannot exceed 250 words. Current count: ' + wordCount);
      return;
    }
    
    try {
      // Convert content to JSON format for backend
      const submitData = {
        ...formData,
        content: formData.content ? [{
          type: 'paragraph',
          children: [{ text: formData.content }]
        }] : []
      };

      if (editingNews) {
        await adminApiService.news.update(editingNews.id, submitData);
      } else {
        await adminApiService.news.create(submitData);
      }
      setShowModal(false);
      setFormData({ 
        news_title: '', 
        content: '',
        keyword: [], 
        news_image: [], 
      });
      setEditingNews(null);
      fetchNews();
    } catch (err) {
      setError('Failed to save news');
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      news_title: newsItem.news_title,
      content: Array.isArray(newsItem.content) 
        ? newsItem.content.map(node => 
            node.children?.map(child => child.text).join('') || ''
          ).join(' ')
        : (typeof newsItem.content === 'string' ? newsItem.content : ''),
      keyword: newsItem.keyword || [],
      news_image: newsItem.news_image || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this news article?')) {
      try {
        await adminApiService.news.delete(id);
        fetchNews();
      } catch (err) {
        setError('Failed to delete news');
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setFormData(prev => ({
        ...prev,
        news_image: [...prev.news_image, ...images]
      }));
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      news_image: prev.news_image.filter((_, i) => i !== index)
    }));
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
        <h1 className="text-2xl font-semibold text-gray-900">News & Articles</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add News</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* News Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Images
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Keywords
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
            {news.map((newsItem) => (
              <tr key={newsItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {newsItem.news_title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {Array.isArray(newsItem.content) 
                        ? newsItem.content.map(node => 
                            node.children?.map(child => child.text).join('') || ''
                          ).join(' ').slice(0, 100) + (newsItem.content.map(node => 
                            node.children?.map(child => child.text).join('') || ''
                          ).join(' ').length > 100 ? '...' : '')
                        : (newsItem.content || '').slice(0, 100) + ((newsItem.content || '').length > 100 ? '...' : '')
                      }
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {newsItem.news_image && newsItem.news_image.length > 0 ? (
                    <div className="flex space-x-1">
                      {newsItem.news_image.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`News ${index + 1}`}
                          className="w-10 h-10 object-cover rounded border"
                        />
                      ))}
                      {newsItem.news_image.length > 3 && (
                        <span className="text-xs text-gray-500 self-center">+{newsItem.news_image.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No images</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {newsItem.keyword.join(', ') || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {newsItem && newsItem.created_at ? (
                    (() => {
                      try {
                        const d = new Date(newsItem.created_at);
                        return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleDateString();
                      } catch (e) {
                        return 'Unknown';
                      }
                    })()
                  ) : (
                    'Unknown'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(newsItem)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(newsItem.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingNews ? 'Edit News' : 'Add News'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-xs text-gray-500">({formData.news_title.length}/25)</span>
                </label>
                <input
                  type="text"
                  value={formData.news_title}
                  onChange={(e) => setFormData({ ...formData, news_title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  maxLength="25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-xs text-gray-500">({formData.content.trim().split(/\s+/).filter(word => word.length > 0).length}/250 words)</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    const wordCount = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
                    
                    // Only update if under word limit
                    if (wordCount <= 250) {
                      setFormData({ ...formData, content: newContent });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  rows="8"
                  placeholder="Enter news content..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords <span className="text-xs text-gray-500">({formData.keyword.join(', ').length}/20)</span>
                </label>
                <input
                  type="text"
                  value={formData.keyword.join(', ')}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value.split(',').map(k => k.trim()) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  maxLength="20"
                  placeholder="e.g., Technology, Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                {formData.news_image.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.news_image.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700"
                >
                  {editingNews ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingNews(null);
                    setFormData({ 
                      news_title: '', 
                      content: '',
                      keyword: [], 
                      news_image: [] 
                    });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;