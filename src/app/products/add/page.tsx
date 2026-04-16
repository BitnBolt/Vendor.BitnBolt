'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProductFormSteps from '@/components/ProductForm/Steps';
import { ProductFormData, ProductFormErrors } from '@/components/ProductForm/types';

const defaultFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  subCategory: '',
  brand: '',
  basePrice: 0,
  profitMargin: 0,
  discount: 0,
  finalPrice: 0,
  stock: 0,
  minimumOrderQuantity: 1,
  images: [],
  whatsInTheBox: [''],
  aboutItem: [''],
  features: [{ key: '', value: '' }],
  specifications: [{ key: '', value: '' }],
  tags: [],
  shippingInfo: {
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
  },
  returnPolicy: {
    isReturnable: true,
    returnWindow: 7,
    returnConditions: [''],
  },
  replacePolicy: {
    isReplaceable: false,
    replaceWindow: 7,
    replaceConditions: [''],
  },
  isPublished: false,
};

export default function AddProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isUploading, setIsUploading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';

    if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (formData.minimumOrderQuantity < 1) {
      newErrors.minimumOrderQuantity = 'Minimum order quantity must be at least 1';
    }

    if (!formData.whatsInTheBox.some((item) => item.trim())) {
      newErrors.whatsInTheBox = 'At least one item is required';
    }
    if (!formData.aboutItem.some((item) => item.trim())) {
      newErrors.aboutItem = 'At least one detail is required';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    if (formData.shippingInfo.weight <= 0) {
      newErrors.shippingInfo = 'Weight must be greater than 0';
    } else if (
      !formData.shippingInfo.dimensions.length ||
      !formData.shippingInfo.dimensions.width ||
      !formData.shippingInfo.dimensions.height
    ) {
      newErrors.shippingInfo = 'Length, width, and height are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.imageUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, result.data.imageUrl],
        }));
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(result.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    try {
      // Clean up the data before sending
      const cleanedFormData = {
        ...formData,
        whatsInTheBox: formData.whatsInTheBox.filter(item => item.trim()),
        aboutItem: formData.aboutItem.filter(item => item.trim()),
        features: formData.features.filter(f => f.key.trim() && f.value.trim()),
        specifications: formData.specifications.filter(s => s.key.trim() && s.value.trim()),
        tags: formData.tags.filter(tag => tag.trim()),
        returnPolicy: {
          ...formData.returnPolicy,
          returnConditions: formData.returnPolicy.returnConditions.filter(c => c.trim()),
        },
        replacePolicy: {
          ...formData.replacePolicy,
          replaceConditions: formData.replacePolicy.replaceConditions.filter(c => c.trim()),
        },
      };

      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      toast.success('Product created successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add product</h1>
          <p className="text-sm text-gray-600">All fields on one page — scroll to review before publishing.</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="shrink-0 px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
        >
          Create product
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-5">
        <ProductFormSteps
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleImageUpload={handleImageUpload}
          isUploading={isUploading}
        />

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create product
          </button>
        </div>
      </div>
    </div>
  );
} 