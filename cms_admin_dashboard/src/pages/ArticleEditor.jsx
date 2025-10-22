import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApiService } from '../services/api';
import TipTapEditor from '../components/TipTapEditor';

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    article_title: '',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    keyword: [],
    article_image: [],
    category: '',
  });

  useEffect(() => {
    if (id && id !== 'new') {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.articles.getById(id);
      const article = response.data;

      let content = article.content;
      if (Array.isArray(content)) {
        // Convert Slate JSON to TipTap JSON
        content = convertSlateToTipTap(content);
      }

      setFormData({
        article_title: article.article_title,
        content: content,
        keyword: article.keyword || [],
        article_image: article.article_image || [],
        category: article.category || '',
      });
    } catch (err) {
      console.error('Failed to fetch article:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert Slate JSON to TipTap JSON
  const convertSlateToTipTap = (slateNodes) => {
    const convertNode = (node) => {
      if (node.type === 'paragraph') {
        return {
          type: 'paragraph',
          content: node.children.map(child => ({
            type: 'text',
            text: child.text,
            marks: [
              ...(child.bold ? [{ type: 'bold' }] : []),
              ...(child.italic ? [{ type: 'italic' }] : []),
              ...(child.underline ? [{ type: 'underline' }] : []),
            ],
          })),
        };
      }
      if (node.type === 'heading-one') {
        return {
          type: 'heading',
          attrs: { level: 1 },
          content: node.children.map(child => ({
            type: 'text',
            text: child.text,
          })),
        };
      }
      if (node.type === 'heading-two') {
        return {
          type: 'heading',
          attrs: { level: 2 },
          content: node.children.map(child => ({
            type: 'text',
            text: child.text,
          })),
        };
      }
      if (node.type === 'heading-three') {
        return {
          type: 'heading',
          attrs: { level: 3 },
          content: node.children.map(child => ({
            type: 'text',
            text: child.text,
          })),
        };
      }
      if (node.type === 'bulleted-list') {
        return {
          type: 'bulletList',
          content: node.children.map(convertNode),
        };
      }
      if (node.type === 'numbered-list') {
        return {
          type: 'orderedList',
          content: node.children.map(convertNode),
        };
      }
      if (node.type === 'list-item') {
        return {
          type: 'listItem',
          content: [{ type: 'paragraph', content: node.children.flatMap(child => child.children || []).map(child => ({ type: 'text', text: child.text })) }],
        };
      }
      if (node.type === 'image') {
        return {
          type: 'image',
          attrs: { src: node.url },
        };
      }
      // Default
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: node.text || '' }],
      };
    };

    return {
      type: 'doc',
      content: slateNodes.map(convertNode),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const submitData = { ...formData };

      if (id && id !== 'new') {
        await adminApiService.articles.update(id, submitData);
      } else {
        await adminApiService.articles.create(submitData);
      }
      navigate('/articles');
    } catch (err) {
      console.error('Failed to save article:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeywordChange = (e) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
    setFormData({ ...formData, keyword: keywords });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading article...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {id && id !== 'new' ? 'Edit Article' : 'Create New Article'}
          </h1>
          <button
            onClick={() => navigate('/articles')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Articles
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Title
            </label>
            <input
              type="text"
              value={formData.article_title}
              onChange={(e) => setFormData({ ...formData, article_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter article title"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={formData.keyword.join(', ')}
              onChange={handleKeywordChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <TipTapEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/articles')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleEditor;