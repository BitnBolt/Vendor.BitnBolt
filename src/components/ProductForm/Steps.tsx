import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ProductFormData, ProductFormErrors } from './types';

interface StepsProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isEditing?: boolean;
  productId?: string;
  errors: ProductFormErrors;
  handleImageUpload?: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export default function ProductFormSteps({
  formData,
  setFormData,
  currentStep,
  isEditing,
  productId,
  errors,
  handleImageUpload: externalHandleImageUpload,
  }: StepsProps) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG and WebP images are allowed');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB');
      return;
    }

    // If external handler is provided, use it
    if (externalHandleImageUpload) {
      await externalHandleImageUpload(file);
      return;
    }

    try {
      setUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append('image', file);
      
      if (isEditing && productId) {
        imageFormData.append('productId', productId);
        if (typeof index === 'number') {
          imageFormData.append('imageIndex', index.toString());
        }
      }

      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: imageFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      if (typeof index === 'number') {
        // Update existing image
        const newImages = [...formData.images];
        newImages[index] = data.data.imageUrl;
        setFormData({ ...formData, images: newImages });
      } else {
        // Add new image
        setFormData({ ...formData, images: [...formData.images, data.data.imageUrl] });
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // const handleImageDelete = async (index: number) => {
  //   if (!isEditing || !productId) {
  //     // For new products, just remove from state
  //     const newImages = formData.images.filter((_, i) => i !== index);
  //     setFormData({ ...formData, images: newImages });
  //     return;
  //   }

  //   try {
  //     setUploadingImage(true);
  //     const token = localStorage.getItem('vendorToken');
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/upload-image?productId=${productId}&imageIndex=${index}`,
  //       {
  //         method: 'DELETE',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to delete image');
  //     }

  //     const newImages = formData.images.filter((_, i) => i !== index);
  //     setFormData({ ...formData, images: newImages });
  //     toast.success('Image deleted successfully');
  //   } catch (error) {
  //     console.error('Image delete error:', error);
  //     toast.error(error instanceof Error ? error.message : 'Failed to delete image');
  //   } finally {
  //     setUploadingImage(false);
  //   }
  // };

  // const renderBasicInfoStep = () => (
  //   <div className="space-y-6">
  //       <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">
  //           Product Name *
  //         </label>
  //         <input
  //           type="text"
  //           value={formData.name}
  //           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  //           className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  //           placeholder="Enter product name"
  //         />
  //         {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
  //       </div>

  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">
  //           Description *
  //         </label>
  //         <textarea
  //           value={formData.description}
  //           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  //           rows={4}
  //           className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  //           placeholder="Enter product description"
  //         />
  //         {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
  //       </div>

  //       <div className="grid grid-cols-2 gap-4">
  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">
  //             Category *
  //           </label>
  //           <input
  //             type="text"
  //             value={formData.category}
  //             onChange={(e) => setFormData({ ...formData, category: e.target.value })}
  //             className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  //             placeholder="Enter category"
  //           />
  //           {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
  //         </div>

  //         <div>
  //           <label className="block text-sm font-medium text-gray-700 mb-2">
  //             Sub Category
  //           </label>
  //           <input
  //             type="text"
  //             value={formData.subCategory}
  //             onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
  //             className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  //             placeholder="Enter sub category (optional)"
  //           />
  //         </div>
  //       </div>

  //       <div>
  //         <label className="block text-sm font-medium text-gray-700 mb-2">
  //           Brand *
  //         </label>
  //         <input
  //           type="text"
  //           value={formData.brand}
  //           onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
  //           className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  //           placeholder="Enter brand name"
  //         />
  //         {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
  //       </div>
  //     </div>
  // );

  // const renderImagesStep = () => (
  //   <div className="space-y-6">
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  //       {formData.images.map((imageUrl, index) => (
  //         <div key={index} className="relative group">
  //           <div className="aspect-square relative overflow-hidden rounded-lg">
  //             <Image
  //               src={imageUrl}
  //               alt={`Product image ${index + 1}`}
  //               fill
  //               className="object-cover"
  //             />
  //           </div>
  //           <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
  //             <label className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100">
  //               <input
  //                 type="file"
  //                 accept="image/jpeg,image/png,image/webp"
  //                 className="hidden"
  //                 onChange={(e) => handleImageUpload(e, index)}
  //                 disabled={externalIsUploading || uploadingImage}
  //               />
  //               <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  //               </svg>
  //             </label>
  //             <button
  //               onClick={() => handleImageDelete(index)}
  //               disabled={externalIsUploading || uploadingImage}
  //               className="p-2 bg-red-500 rounded-full hover:bg-red-600"
  //             >
  //               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  //               </svg>
  //             </button>
  //           </div>
  //         </div>
  //       ))}
  //       {formData.images.length < 5 && (
  //         <label className="aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
  //           <input
  //             type="file"
  //             accept="image/jpeg,image/png,image/webp"
  //             className="hidden"
  //             onChange={handleImageUpload}
  //             disabled={externalIsUploading || uploadingImage}
  //           />
  //           <div className="text-center">
  //             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  //             </svg>
  //             <span className="mt-2 block text-sm font-medium text-gray-600">
  //               {(externalIsUploading || uploadingImage) ? 'Uploading...' : 'Add Image'}
  //             </span>
  //           </div>
  //         </label>
  //       )}
  //     </div>
  //     <p className="text-sm text-gray-500">
  //       Upload up to 5 images. Supported formats: JPEG, PNG, WebP. Maximum size: 5MB per image.
  //     </p>
  //   </div>
  // );

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter product name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter product description"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter category"
            />
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Category
            </label>
            <input
              type="text"
              value={formData.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter sub category (optional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand *
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter brand name"
          />
          {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand}</p>}
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Pricing & Stock</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price (₹) *
            </label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.basePrice && <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Order Quantity
          </label>
          <input
            type="number"
            value={formData.minimumOrderQuantity}
            onChange={(e) => setFormData({ ...formData, minimumOrderQuantity: parseInt(e.target.value) })}
            min="1"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.minimumOrderQuantity && <p className="mt-1 text-sm text-red-600">{errors.minimumOrderQuantity}</p>}
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Features & Details</h2>
        
        {/* What's in the Box */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What&apos;`s in the Box *
          </label>
          {formData.whatsInTheBox.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...formData.whatsInTheBox];
                  newItems[index] = e.target.value;
                  setFormData({ ...formData, whatsInTheBox: newItems });
                }}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter item"
              />
              <button
                type="button"
                onClick={() => {
                  const newItems = formData.whatsInTheBox.filter((_, i) => i !== index);
                  setFormData({ ...formData, whatsInTheBox: newItems.length ? newItems : [''] });
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, whatsInTheBox: [...formData.whatsInTheBox, ''] })}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Item
          </button>
          {errors.whatsInTheBox && <p className="mt-1 text-sm text-red-600">{errors.whatsInTheBox}</p>}
        </div>

        {/* About Item */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            About this Item *
          </label>
          {formData.aboutItem.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...formData.aboutItem];
                  newItems[index] = e.target.value;
                  setFormData({ ...formData, aboutItem: newItems });
                }}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter detail"
              />
              <button
                type="button"
                onClick={() => {
                  const newItems = formData.aboutItem.filter((_, i) => i !== index);
                  setFormData({ ...formData, aboutItem: newItems.length ? newItems : [''] });
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, aboutItem: [...formData.aboutItem, ''] })}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Detail
          </button>
          {errors.aboutItem && <p className="mt-1 text-sm text-red-600">{errors.aboutItem}</p>}
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features
          </label>
          {formData.features.map((feature, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={feature.key}
                onChange={(e) => {
                  const newFeatures = [...formData.features];
                  newFeatures[index] = { ...feature, key: e.target.value };
                  setFormData({ ...formData, features: newFeatures });
                }}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Feature name"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feature.value}
                  onChange={(e) => {
                    const newFeatures = [...formData.features];
                    newFeatures[index] = { ...feature, value: e.target.value };
                    setFormData({ ...formData, features: newFeatures });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Feature value"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFeatures = formData.features.filter((_, i) => i !== index);
                    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [{ key: '', value: '' }] });
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, features: [...formData.features, { key: '', value: '' }] })}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Feature
          </button>
        </div>

        {/* Specifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specifications
          </label>
          {formData.specifications.map((spec, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={spec.key}
                onChange={(e) => {
                  const newSpecs = [...formData.specifications];
                  newSpecs[index] = { ...spec, key: e.target.value };
                  setFormData({ ...formData, specifications: newSpecs });
                }}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Specification name"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => {
                    const newSpecs = [...formData.specifications];
                    newSpecs[index] = { ...spec, value: e.target.value };
                    setFormData({ ...formData, specifications: newSpecs });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Specification value"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSpecs = formData.specifications.filter((_, i) => i !== index);
                    setFormData({ ...formData, specifications: newSpecs.length ? newSpecs : [{ key: '', value: '' }] });
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, specifications: [...formData.specifications, { key: '', value: '' }] })}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            + Add Specification
          </button>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    const newTags = formData.tags.filter((_, i) => i !== index);
                    setFormData({ ...formData, tags: newTags });
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a tag"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  setFormData({
                    ...formData,
                    tags: [...formData.tags, e.currentTarget.value.trim()]
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Press Enter to add a tag</p>
        </div>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Product Images</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = formData.images.filter((_, i) => i !== index);
                    setFormData({ ...formData, images: newImages });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  await handleImageUpload(e);
                }}
              />
              {uploadingImage ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="text-sm text-gray-500">Add Image</span>
                </>
              )}
            </label>
          </div>
          {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
          <p className="mt-2 text-sm text-gray-500">
            Upload high-quality images of your product. First image will be used as the main image.
          </p>
        </div>
      </div>
    );
  }

  if (currentStep === 5) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Shipping & Return Policy</h2>
        
        {/* Shipping Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Shipping Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (grams) *
              </label>
              <input
                type="number"
                value={formData.shippingInfo.weight}
                onChange={(e) => setFormData({
                  ...formData,
                  shippingInfo: {
                    ...formData.shippingInfo,
                    weight: parseFloat(e.target.value),
                  },
                })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.shippingInfo && <p className="mt-1 text-sm text-red-600">{errors.shippingInfo}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimensions (cm)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  value={formData.shippingInfo.dimensions.length}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingInfo: {
                      ...formData.shippingInfo,
                      dimensions: {
                        ...formData.shippingInfo.dimensions,
                        length: parseFloat(e.target.value),
                      },
                    },
                  })}
                  min="0"
                  step="0.1"
                  placeholder="Length"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.shippingInfo.dimensions.width}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingInfo: {
                      ...formData.shippingInfo,
                      dimensions: {
                        ...formData.shippingInfo.dimensions,
                        width: parseFloat(e.target.value),
                      },
                    },
                  })}
                  min="0"
                  step="0.1"
                  placeholder="Width"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.shippingInfo.dimensions.height}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingInfo: {
                      ...formData.shippingInfo,
                      dimensions: {
                        ...formData.shippingInfo.dimensions,
                        height: parseFloat(e.target.value),
                      },
                    },
                  })}
                  min="0"
                  step="0.1"
                  placeholder="Height"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Return Policy */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Return Policy</h3>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="isReturnable"
              checked={formData.returnPolicy.isReturnable}
              onChange={(e) => setFormData({
                ...formData,
                returnPolicy: {
                  ...formData.returnPolicy,
                  isReturnable: e.target.checked,
                },
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isReturnable" className="ml-2 block text-sm text-gray-700">
              Allow returns for this product
            </label>
          </div>

          {formData.returnPolicy.isReturnable && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Window (days)
                </label>
                <input
                  type="number"
                  value={formData.returnPolicy.returnWindow}
                  onChange={(e) => setFormData({
                    ...formData,
                    returnPolicy: {
                      ...formData.returnPolicy,
                      returnWindow: parseInt(e.target.value),
                    },
                  })}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Conditions
                </label>
                {formData.returnPolicy.returnConditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={condition}
                      onChange={(e) => {
                        const newConditions = [...formData.returnPolicy.returnConditions];
                        newConditions[index] = e.target.value;
                        setFormData({
                          ...formData,
                          returnPolicy: {
                            ...formData.returnPolicy,
                            returnConditions: newConditions,
                          },
                        });
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter return condition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newConditions = formData.returnPolicy.returnConditions.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          returnPolicy: {
                            ...formData.returnPolicy,
                            returnConditions: newConditions.length ? newConditions : [''],
                          },
                        });
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    returnPolicy: {
                      ...formData.returnPolicy,
                      returnConditions: [...formData.returnPolicy.returnConditions, ''],
                    },
                  })}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Add Condition
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
} 