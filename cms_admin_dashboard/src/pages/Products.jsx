import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [draggedProduct, setDraggedProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    features: [''],
    benefit: [''],
    performance: [''],
    images: [],
    comments: '',
  });

  // Helper function to count words
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Word limits
  const limits = {
    title: 50,
    description: 50,
    feature: 20,
    benefit: 20,
    performance: 20,
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.products.getAll();
      // Sort products by position (ascending order)
      const sortedProducts = response.data.sort((a, b) => (a.position || 999) - (b.position || 999));
      setProducts(sortedProducts);
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate word limits
    if (countWords(formData.title) > limits.title) {
      setError(`Title cannot exceed ${limits.title} words`);
      return;
    }
    if (countWords(formData.description) > limits.description) {
      setError(`Description cannot exceed ${limits.description} words`);
      return;
    }
    if (formData.features.some(f => countWords(f) > limits.feature)) {
      setError(`Each performance item cannot exceed ${limits.feature} words`);
      return;
    }
    if (formData.benefit.some(b => countWords(b) > limits.benefit)) {
      setError(`Each main application item cannot exceed ${limits.benefit} words`);
      return;
    }
    if (formData.performance.some(p => countWords(p) > limits.performance)) {
      setError(`Each benefit item cannot exceed ${limits.performance} words`);
      return;
    }
    
    try {
      const featuresArray = formData.features.filter(f => f.trim());
      const benefitArray = formData.benefit.filter(b => b.trim());
      const performanceArray = formData.performance.filter(p => p.trim());
      const imagesArray = formData.images.filter(i => i && i.trim());

      const productData = {
        product_name: formData.title,
        product_description: formData.description,
        product_image: imagesArray,
        main_application: featuresArray,
        benefit: benefitArray,
        performance: performanceArray,
        comments: formData.comments,
      };

      if (editingProduct) {
        await adminApiService.products.update(editingProduct.id, productData);
      } else {
        await adminApiService.products.create(productData);
      }
      setShowModal(false);
      setFormData({ title: '', description: '', features: [''], benefit: [''], performance: [''], images: [], comments: '' });
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      setError('Failed to save product');
      console.error('Error saving product:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.product_name || '',
      description: product.product_description || '',
      features: Array.isArray(product.main_application) && product.main_application.length ? product.main_application : [''],
      benefit: Array.isArray(product.benefit) && product.benefit.length ? product.benefit : [''],
      performance: Array.isArray(product.performance) && product.performance.length ? product.performance : [''],
      images: Array.isArray(product.product_image) ? product.product_image : [],
      comments: product.comments || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApiService.products.delete(id);
        fetchProducts();
      } catch (err) {
        setError('Failed to delete product');
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
        images: [...prev.images, ...images]
      }));
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e, product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedProduct(null);
  };

  const handleDrop = async (e, targetProduct) => {
    e.preventDefault();
    
    if (!draggedProduct || draggedProduct.id === targetProduct.id) {
      return;
    }

    const draggedIndex = products.findIndex(p => p.id === draggedProduct.id);
    const targetIndex = products.findIndex(p => p.id === targetProduct.id);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Create new array with reordered products
    const newProducts = [...products];
    const [removed] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(targetIndex, 0, removed);

    // Update positions
    const updatedProducts = newProducts.map((product, index) => ({
      ...product,
      position: index + 1
    }));

    setProducts(updatedProducts);

    // Save new positions to backend
    try {
      await Promise.all(
        updatedProducts.map(product =>
          adminApiService.products.update(product.id, {
            product_name: product.product_name,
            product_description: product.product_description,
            product_image: product.product_image,
            main_application: product.main_application,
            benefit: product.benefit,
            performance: product.performance,
            comments: product.comments,
            position: product.position,
          })
        )
      );
    } catch (err) {
      setError('Failed to update product positions');
      // Revert changes on error
      fetchProducts();
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600 mt-1">Drag and drop products to reorder them</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className={`bg-white rounded-lg shadow p-6 cursor-move transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              draggedProduct?.id === product.id ? 'opacity-50 scale-95 shadow-2xl' : ''
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, product)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, product)}
          >
            {product.product_image && product.product_image.length > 0 && (
              <img
                src={product.product_image[0]}
                alt={product.product_name}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {product.product_name}
              </h3>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                #{product.position}
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {product.product_description}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Drag to reorder
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title="Edit product"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Delete product"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-xs text-gray-500">({countWords(formData.title)}/{limits.title} words)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <p className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {editingProduct ? editingProduct.position : (products.length + 1)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-xs text-gray-500">({countWords(formData.description)}/{limits.description} words)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performance</label>
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={feature}
                        onChange={e => {
                          const updated = [...formData.features];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, features: updated });
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <span className="text-xs text-gray-500 ml-1">({countWords(feature)}/{limits.feature} words)</span>
                    </div>
                    {formData.features.length > 1 && (
                      <button type="button" className="ml-2 text-red-500" onClick={() => {
                        setFormData({ ...formData, features: formData.features.filter((_, i) => i !== idx) });
                      }}>-</button>
                    )}
                    {idx === formData.features.length - 1 && formData.features.length < 3 && (
                      <button type="button" className="ml-2 text-green-500" onClick={() => {
                        setFormData({ ...formData, features: [...formData.features, ''] });
                      }}>+</button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Applications</label>
                {formData.benefit.map((benefit, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={benefit}
                        onChange={e => {
                          const updated = [...formData.benefit];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, benefit: updated });
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <span className="text-xs text-gray-500 ml-1">({countWords(benefit)}/{limits.benefit} words)</span>
                    </div>
                    {formData.benefit.length > 1 && (
                      <button type="button" className="ml-2 text-red-500" onClick={() => {
                        setFormData({ ...formData, benefit: formData.benefit.filter((_, i) => i !== idx) });
                      }}>-</button>
                    )}
                    {idx === formData.benefit.length - 1 && formData.benefit.length < 3 && (
                      <button type="button" className="ml-2 text-green-500" onClick={() => {
                        setFormData({ ...formData, benefit: [...formData.benefit, ''] });
                      }}>+</button>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Benefit</label>
                {formData.performance.map((perf, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={perf}
                        onChange={e => {
                          const updated = [...formData.performance];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, performance: updated });
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <span className="text-xs text-gray-500 ml-1">({countWords(perf)}/{limits.performance} words)</span>
                    </div>
                    {formData.performance.length > 1 && (
                      <button type="button" className="ml-2 text-red-500" onClick={() => {
                        setFormData({ ...formData, performance: formData.performance.filter((_, i) => i !== idx) });
                      }}>-</button>
                    )}
                    {idx === formData.performance.length - 1 && formData.performance.length < 3 && (
                      <button type="button" className="ml-2 text-green-500" onClick={() => {
                        setFormData({ ...formData, performance: [...formData.performance, ''] });
                      }}>+</button>
                    )}
                  </div>
                ))}
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
                {formData.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.images.map((image, index) => (
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
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setFormData({ title: '', description: '', features: [''], benefit: [''], performance: [''], images: [], comments: '' });
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

export default Products;