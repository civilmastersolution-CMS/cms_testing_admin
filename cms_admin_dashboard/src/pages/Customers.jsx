import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_image: [''],
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.customerships.getAll();
  setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        customer_image: formData.customer_image.filter((img) => img && img.trim() !== ''),
      };
      if (editingCustomer) {
        await adminApiService.customerships.update(editingCustomer.id, dataToSend);
      } else {
        await adminApiService.customerships.create(dataToSend);
      }
      setShowModal(false);
      setFormData({ customer_name: '', customer_image: [] });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      setError('Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      customer_image: Array.isArray(customer.customer_image) ? customer.customer_image : (customer.customer_image ? [customer.customer_image] : []),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await adminApiService.customerships.delete(id);
        fetchCustomers();
      } catch (err) {
        setError('Failed to delete customer');
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
        customer_image: [...prev.customer_image, ...images]
      }));
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      customer_image: prev.customer_image.filter((_, i) => i !== index)
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
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow p-6">
            {Array.isArray(customer.customer_image) && customer.customer_image[0] ? (
              <img
                src={customer.customer_image[0]}
                alt={customer.customer_name}
                className="w-full h-32 object-cover rounded-lg mb-4"
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://via.placeholder.com/400x128/4B5563/FFFFFF?text=${encodeURIComponent(customer.customer_name || 'Customer')}`;
                }}
              />
            ) : (
              <img
                src={`https://via.placeholder.com/400x128/4B5563/FFFFFF?text=${encodeURIComponent(customer.customer_name || 'Customer')}`}
                alt={customer.customer_name}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {customer.customer_name}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(customer)}
                className="text-blue-600 hover:text-blue-900"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(customer.id)}
                className="text-red-600 hover:text-red-900"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
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
                {formData.customer_image.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.customer_image.map((image, index) => (
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
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    setFormData({ customer_name: '', customer_image: [] });
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

export default Customers;