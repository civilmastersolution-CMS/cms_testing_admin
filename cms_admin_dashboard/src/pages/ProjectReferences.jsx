import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, EyeIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const ProjectReferences = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewProject, setPreviewProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    project_name: '',
    location: '',
    site_area: '',
    date_time: '',
    contractor: '',
    layout_type: 1, // 1-4 for different layouts
    project_image: ['', '', '', ''], // Array of base64 images or empty strings
    is_favorite: false, // New favorite field
    position: 1,
  });

  // Layout configurations
  const layoutConfigs = {
    1: { 
      name: 'Single Image Layout', 
      imageCount: 1,
      description: 'One large featured image',
      positions: ['Main Featured Image'],
      positionDescriptions: ['Primary hero image showcasing the main project view']
    },
    2: { 
      name: 'Dual Image Layout', 
      imageCount: 2,
      description: 'Two equal-sized images side by side',
      positions: ['Left Image', 'Right Image'],
      positionDescriptions: [
        'Left side image showing project overview or entrance',
        'Right side image showing additional project details or interior'
      ]
    },
    3: { 
      name: 'Triple Image Layout', 
      imageCount: 3,
      description: 'Three Images',
      positions: ['First Image', 'Second Image', 'Third Image'],
      positionDescriptions: [
        'First image as the main focal point of the project',
        'Second image showing secondary project features',
        'Third image displaying additional project aspects'
      ]
    },
    4: { 
      name: 'Quad Image Layout', 
      imageCount: 4,
      description: 'Four Images',
      positions: ['First Image', 'Second Image', 'Third Image', 'Fourth Image'],
      positionDescriptions: [
        'First image showing project entrance or overview',
        'Second image displaying key project features',
        'Third image showing project details or construction',
        'Fourt image highlighting project completion or results'
      ]
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.projectReferences.getAll();
      // Sort projects by position (ascending order)
      const sortedProjects = response.data.sort((a, b) => (a.position || 999) - (b.position || 999));
      setProjects(sortedProjects);
    } catch (err) {
      setError('Failed to fetch project references');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const layoutConfig = layoutConfigs[formData.layout_type];
      const filteredImages = formData.project_image.slice(0, layoutConfig.imageCount).filter(img => img.trim());
      
      const projectData = {
        project_name: formData.project_name,
        location: formData.location,
        site_area: formData.site_area,
        date_time: formData.date_time,
        contractor: formData.contractor,
        layout_type: parseInt(formData.layout_type),
        project_image: filteredImages,
        position: parseInt(formData.position) || 1,
      };

      console.log('Sending project data:', projectData);

      if (editingProject) {
        await adminApiService.projectReferences.update(editingProject.id, projectData);
      } else {
        await adminApiService.projectReferences.create(projectData);
      }
      setShowModal(false);
      resetForm();
      fetchProjects();
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error saving project:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.data) {
        // Try to show specific field errors if available
        const errorData = err.response.data;
        let errorMessage = 'Failed to save project reference';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          // Handle field-specific errors
          const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
            const errorList = Array.isArray(errors) ? errors : [errors];
            return `${field}: ${errorList.join(', ')}`;
          }).join('; ');
          if (fieldErrors) {
            errorMessage = `Validation errors: ${fieldErrors}`;
          }
        }
        
        setError(errorMessage);
      } else {
        setError('Failed to save project reference. Please check your data and try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project_name: '',
      location: '',
      site_area: '',
      date_time: '',
      contractor: '',
      layout_type: 1,
      project_image: ['', '', '', ''],
      is_favorite: false,
      position: 1,
    });
    setEditingProject(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    const images = Array.isArray(project.project_image) ? project.project_image : [];
    
    // Ensure we have an array with exactly 4 elements
    const projectImages = [...images];
    while (projectImages.length < 4) {
      projectImages.push('');
    }
    projectImages.splice(4); // Ensure no more than 4
    
    setFormData({
      project_name: project.project_name || '',
      location: project.location || '',
      site_area: project.site_area || '',
      date_time: project.date_time || '',
      contractor: project.contractor || '',
      layout_type: parseInt(project.layout_type) || 1,
      project_image: projectImages,
      is_favorite: project.is_favorite || false,
      position: project.position || 1,
    });
    setShowModal(true);
    setError(null); // Clear any previous errors
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project reference?')) {
      try {
        await adminApiService.projectReferences.delete(id);
        fetchProjects();
      } catch (err) {
        setError('Failed to delete project reference');
      }
    }
  };

  const handlePreview = (project) => {
    setPreviewProject(project);
    setShowPreview(true);
  };

  const handleToggleFavorite = async (project) => {
    try {
      const response = await adminApiService.projectReferences.toggleFavorite(project.id);
      
      // Update the local state
      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === project.id 
            ? { ...p, is_favorite: response.data.is_favorite }
            : p
        )
      );
      
      // Show success/error message
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError(null);
        // Optional: Show success message
        console.log(response.data.message);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to update favorite status');
      }
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.project_image];
    newImages[index] = value;
    setFormData({ ...formData, project_image: newImages });
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImages = [...formData.project_image];
        newImages[index] = event.target.result;
        setFormData({ ...formData, project_image: newImages });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.project_image];
    newImages[index] = '';
    setFormData({ ...formData, project_image: newImages });
  };

  const renderLayoutPreview = (layoutType, images) => {
    const config = layoutConfigs[layoutType];
    
    // Check if we have any images at all
    const hasImages = images.some(img => img && img.trim());
    
    if (!hasImages) {
      return (
        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <PhotoIcon className="w-8 h-8 text-gray-400" />
        </div>
      );
    }

    // Helper function to render image with error handling
    const renderImage = (imageUrl, className = "") => {
      if (!imageUrl || !imageUrl.trim()) {
        return (
          <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
            <PhotoIcon className="w-4 h-4 text-gray-400" />
          </div>
        );
      }
      
      return (
        <div 
          className={`bg-cover bg-center rounded-lg ${className}`}
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="w-full h-full bg-black bg-opacity-10 rounded-lg"></div>
        </div>
      );
    };

    switch (layoutType) {
      case 1:
        return (
          <div className="w-full h-32">
            {renderImage(images[0], "w-full h-full")}
          </div>
        );
      
      case 2:
        return (
          <div className="grid grid-cols-2 gap-2 h-32">
            {renderImage(images[0], "w-full h-full")}
            {renderImage(images[1], "w-full h-full")}
          </div>
        );
      
      case 3:
        // Layout 3: Three images in a horizontal row
        return (
          <div className="grid grid-cols-3 gap-2 h-32">
            {renderImage(images[0], "w-full h-full")}
            {renderImage(images[1], "w-full h-full")}
            {renderImage(images[2], "w-full h-full")}
          </div>
        );
      
      case 4:
        // Layout 4: Four images in a horizontal row
        return (
          <div className="grid grid-cols-4 gap-2 h-32">
            {renderImage(images[0], "w-full h-full")}
            {renderImage(images[1], "w-full h-full")}
            {renderImage(images[2], "w-full h-full")}
            {renderImage(images[3], "w-full h-full")}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Full screen layout renderer (matching reference_1.jsx exactly)
  const renderFullScreenLayout = (layoutType, images) => {
    const validImages = images.filter(img => img && img.trim());
    
    if (validImages.length === 0) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <PhotoIcon className="w-16 h-16 text-gray-400" />
        </div>
      );
    }

    // Helper function for full-screen image rendering
    const renderFullImage = (imageUrl, className = "") => (
      <div 
        key={imageUrl}
        className={`bg-cover bg-center rounded-lg ${className}`}
        style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none' }}
      >
        <div className="w-full h-full bg-black bg-opacity-20 rounded-lg"></div>
      </div>
    );

    // Get grid layout for horizontal rows
    const getGridLayout = (layoutType, count) => {
      switch(layoutType) {
        case 1: return "grid-cols-1";
        case 2: return "grid-cols-2";
        case 3: return "grid-cols-3"; // 3 images in a horizontal row
        case 4: return "grid-cols-4"; // 4 images in a horizontal row
        default: return "grid-cols-1";
      }
    };

    const getImageClasses = (index, layoutType) => {
      // For layouts 3 and 4, all images are equal size in horizontal rows
      return "";
    };

    const imageCount = Math.min(validImages.length, 4);
    const displayImages = validImages.slice(0, imageCount);

    return (
      <div className={`w-full h-full grid gap-4 ${getGridLayout(layoutType, imageCount)}`}>
        {displayImages.map((image, index) => 
          renderFullImage(image, getImageClasses(index, layoutType))
        )}
      </div>
    );
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
        <h1 className="text-2xl font-semibold text-gray-900">Project References</h1>
        <button
          onClick={() => {
            setShowModal(true);
            setError(null); // Clear any previous errors
          }}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow p-6">
            {/* Layout Preview */}
            {renderLayoutPreview(project.layout_type || 1, project.project_image || [])}
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.project_name}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Location:</span> {project.location}</p>
                <p><span className="font-medium">Date:</span> {project.date_time}</p>
                <p><span className="font-medium">Layout:</span> {layoutConfigs[project.layout_type || 1]?.name}</p>
                <p><span className="font-medium">Position:</span> {project.position || 'Not set'}</p>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleToggleFavorite(project)}
                className={`${project.is_favorite ? 'text-red-600 hover:text-red-700' : 'text-gray-400 hover:text-red-600'} transition-colors`}
                title={project.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                {project.is_favorite ? (
                  <HeartIconSolid className="w-5 h-5" />
                ) : (
                  <HeartIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => handlePreview(project)}
                className="text-green-600 hover:text-green-900"
                title="Preview"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleEdit(project)}
                className="text-blue-600 hover:text-blue-900"
                title="Edit"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(project.id)}
                className="text-red-600 hover:text-red-900"
                title="Delete"
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
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingProject ? 'Edit Project Reference' : 'Add Project Reference'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Project Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={formData.project_name}
                      onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="e.g., Chonburi, Thailand"
                        required
                      />
                      <div className="text-xs text-gray-500">
                        <p className="font-medium mb-1">Format examples:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, location: 'Chiang Mai, Thailand' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • Chiang Mai, Thailand
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, location: 'Bangkok, Thailand' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • Bangkok, Thailand
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, location: 'Phuket, Thailand' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • Phuket, Thailand
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, location: 'Chonburi, Thailand' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • Chonburi, Thailand
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Area *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.site_area}
                        onChange={(e) => setFormData({ ...formData, site_area: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="e.g., 15000 SQ.M"
                        required
                      />
                      <div className="text-xs text-gray-500">
                        <p className="font-medium mb-1">Format examples:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, site_area: '15000 SQ.M' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • 15000 SQ.M
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, site_area: '25000 SQ.M' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • 25000 SQ.M
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date/Time *
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.date_time}
                        onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="e.g., July 2024, March 2023, Q1 2024"
                        required
                      />
                      <div className="text-xs text-gray-500">
                        <p className="font-medium mb-1">Format examples:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, date_time: 'January 2024' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • January 2024
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, date_time: 'Q1 2024' })}
                            className="text-left text-cyan-600 hover:text-cyan-800"
                          >
                            • Q1 2024
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contractor 
                    </label>
                    <input
                      type="text"
                      value={formData.contractor}
                      onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Position
                    </label>
                    <input
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Enter position number (1, 2, 3...)"
                      min="1"
                    />
                  </div>
                </div>

                {/* Right Column - Layout & Images */}
                <div className="space-y-4">
                  {/* Layout Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Layout Type *
                    </label>
                    <select
                      value={formData.layout_type}
                      onChange={(e) => setFormData({ ...formData, layout_type: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      {Object.entries(layoutConfigs).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.name} - {config.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Layout Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Layout Preview
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4">
                      {renderLayoutPreview(formData.layout_type, formData.project_image)}
                    </div>
                  </div>

                  {/* Image Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Images
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      💡 Upload high-quality images for the selected layout. The first image is the main featured image.
                    </p>
                    <div className="space-y-3">
                      {layoutConfigs[formData.layout_type].positions.map((position, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {position} {index === 0 ? '(Primary Featured Image)' : `(Image ${index + 1})`}
                          </label>
                          <p className="text-xs text-gray-500 mb-2">
                            {layoutConfigs[formData.layout_type].positionDescriptions[index]}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, index)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                          />
                          {formData.project_image[index] && (
                            <div className="mt-2 relative">
                              <img 
                                src={formData.project_image[index]} 
                                alt={`Preview ${index + 1}`}
                                className="w-16 h-12 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                >
                  {editingProject ? 'Update' : 'Create'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewProject && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Preview: {previewProject.project_name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            {/* Full Reference Component Style Preview */}
            <div className="relative bg-white rounded-lg" style={{ height: '500px' }}>
              {/* Title at top center */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
                <h1 className="text-black text-2xl font-bold text-center">
                  {previewProject.project_name}
                </h1>
              </div>
              
              {/* Images Grid - Full Screen Style */}
              <div className="absolute inset-0 top-16 bottom-0 p-4">
                {renderFullScreenLayout(previewProject.layout_type || 1, previewProject.project_image || [])}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReferences;