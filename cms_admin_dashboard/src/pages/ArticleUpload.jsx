import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApiService } from '../services/api';

const ArticleUpload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [objectUrls, setObjectUrls] = useState([]);
  const [formData, setFormData] = useState({
    article_title: '',
    keyword: '',
    category: '',
    html_file: null,
    image_files: [],
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length !== files.length) {
      alert('Please select only image files');
    }
    
    setFormData({ ...formData, image_files: validImages });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/html') {
      setFormData({ ...formData, html_file: file });
    } else {
      alert('Please select a valid HTML file');
      e.target.value = '';
    }
  };

  const handlePreview = async () => {
    if (!formData.html_file) {
      alert('Please select an HTML file first');
      return;
    }

    try {
      const htmlContent = await formData.html_file.text();
      
      // Process images for preview
      let processedHtml = htmlContent;
      
      // Remove base tag to prevent URL resolution issues
      processedHtml = processedHtml.replace(/<base[^>]*>/gi, '');
      
      const newObjectUrls = [];
      if (formData.image_files.length > 0) {
        // Create a mapping of original filenames to object URLs
        const imageMap = {};
        
        for (const image of formData.image_files) {
          const objectUrl = URL.createObjectURL(image);
          newObjectUrls.push(objectUrl);
          
          // Try multiple variations of the original filename
          const original_name = image.name;
          const variations = [
            original_name,  // original
            original_name.toLowerCase(),  // lowercase
            original_name.split('.')[0],  // without extension
            original_name.split('.')[0].toLowerCase(),  // lowercase without extension
            // Try different extensions
            original_name.split('.')[0] + '.png',
            original_name.split('.')[0] + '.jpg',
            original_name.split('.')[0] + '.jpeg',
            original_name.split('.')[0] + '.gif',
          ];
          
          for (const variation of variations) {
            imageMap[variation] = objectUrl;
          }
        }

        // Replace image src attributes in HTML
        processedHtml = processedHtml.replace(/<img[^>]+src=([^ >]+)[^>]*>/gi, (match, src) => {
          // Remove quotes if present
          src = src.replace(/^["']|["']$/g, '');
          
          // Skip if already a data URL (base64) or external URL
          if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
            return match;
          }
          
          // Try different ways to match the filename
          const possible_names = [
            src,  // full path
            src.split('/').pop(),  // just filename
            src.split('/').pop().toLowerCase(),  // lowercase filename
            src.split('/').pop().split('.')[0],  // without extension
            src.split('/').pop().split('.')[0].toLowerCase(),  // lowercase without extension
            // Try variations with different extensions
            src.split('/').pop().split('.')[0] + '.png',
            src.split('/').pop().split('.')[0] + '.jpg',
            src.split('/').pop().split('.')[0] + '.jpeg',
            src.split('/').pop().split('.')[0] + '.gif',
          ];
          
          for (const name of possible_names) {
            if (imageMap[name]) {
              return match.replace(src, imageMap[name]);
            }
          }
          
          return match;  // No replacement found
        });
      }
      
      setObjectUrls(newObjectUrls);
      setPreviewHtml(processedHtml);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview failed:', err);
      alert('Failed to generate preview');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.html_file) {
      alert('Please select an HTML file');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file uploads
      const uploadData = new FormData();
      uploadData.append('html_file', formData.html_file);
      uploadData.append('article_title', formData.article_title);
      uploadData.append('keyword', formData.keyword);
      uploadData.append('category', formData.category);

      // Add all image files
      formData.image_files.forEach((file, index) => {
        uploadData.append('images', file);
      });

      console.log('Uploading article with images...');
      
      // Upload to Django backend
      const response = await adminApiService.articles.uploadArticle(uploadData);
      
      console.log('Article uploaded successfully:', response.data);
      navigate('/articles');
    } catch (err) {
      console.error('Failed to upload article:', err);
      alert('Failed to upload article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert file to base64 (kept for potential future use)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Upload Google Doc Article</h1>
          <button
            onClick={() => navigate('/articles')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Articles
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to upload:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Open your Google Doc</li>
            <li>2. Go to File → Download → Web Page (.html, zipped)</li>
            <li>3. Unzip the downloaded file</li>
            <li>4. Upload the "document.html" file below</li>
            <li>5. Upload ALL images from the "images" folder</li>
            <li>6. Click "Preview" to check if images are embedded correctly</li>
            <li>7. Fill in title, keywords, and category, then upload</li>
          </ol>
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>Tip:</strong> Make sure to upload ALL images from the images folder. 
              The system will automatically embed them into the HTML.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HTML File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML File (from Google Docs)
            </label>
            <input
              type="file"
              accept=".html"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {formData.html_file && (
              <p className="mt-1 text-sm text-gray-600">
                Selected: {formData.html_file.name}
              </p>
            )}
          </div>

          {/* Images Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (from Google Docs export - optional)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.image_files.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                Selected: {formData.image_files.length} image(s)
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Upload images from the "images" folder that comes with your Google Docs HTML export
            </p>
          </div>

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
              placeholder="Enter category (e.g., Technical, Industry News, Case Studies)"
              required
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/articles')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              disabled={loading || !formData.html_file}
            >
              Preview
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Article'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Article Preview</h3>
              <button
                onClick={() => {
                  objectUrls.forEach(url => URL.revokeObjectURL(url));
                  setObjectUrls([]);
                  setShowPreview(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div 
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                className="prose max-w-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleUpload;