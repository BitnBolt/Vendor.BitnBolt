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
  isPublished: false,
};

export default function AddProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isUploading, setIsUploading] = useState(false);

  const validateStep = (step: number): boolean => {
    const newErrors: ProductFormErrors = {};

    switch (step) {
      case 1:
        if (!formData.name) newErrors.name = 'Product name is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.brand) newErrors.brand = 'Brand is required';
        break;

      case 2:
        if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
        if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
        if (formData.minimumOrderQuantity < 1) newErrors.minimumOrderQuantity = 'Minimum order quantity must be at least 1';
        break;

      case 3:
        if (!formData.whatsInTheBox.some(item => item.trim())) {
          newErrors.whatsInTheBox = 'At least one item is required';
        }
        if (!formData.aboutItem.some(item => item.trim())) {
          newErrors.aboutItem = 'At least one detail is required';
        }
        break;

      case 4:
        if (formData.images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;

      case 5:
        if (!formData.shippingInfo.weight) {
          newErrors.shippingInfo = 'Weight is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
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
    if (!validateStep(currentStep)) {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
        <p className="text-gray-600">Fill in the details to create a new product</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <ProductFormSteps
          formData={formData}
          setFormData={setFormData}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          errors={errors}
          handleImageUpload={handleImageUpload}
          isUploading={isUploading}
        />

        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              Previous
            </button>
          )}
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-auto"
            >
              Create Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 