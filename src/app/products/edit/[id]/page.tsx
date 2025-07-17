'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ProductFormSteps from '@/components/ProductForm/Steps';
import { ProductFormData } from '@/components/ProductForm/types';

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  subCategory: '',
  brand: '',
  basePrice: 0,
  stock: 0,
  minimumOrderQuantity: 1,
  whatsInTheBox: [''],
  aboutItem: [''],
  features: [{ key: '', value: '' }],
  specifications: [{ key: '', value: '' }],
  tags: [],
  images: [],
  profitMargin: 0,
  discount: 0,
  finalPrice: 0,
  isPublished: false,
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
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('vendorToken');
        if (!token) {
          router.push('/auth/signin');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('vendorToken');
            router.push('/auth/signin');
            return;
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setFormData(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!validateStep(currentStep)) {
        toast.error('Please fix the errors before submitting');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/${params.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setSubmitError(null);

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
        const data = await response.json();
        throw new Error(data.message || 'Failed to upload image');
      }

      const { data: { url } } = await response.json();
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url],
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/${params.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation function
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.category.trim()) newErrors.category = 'Category is required';
        if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
        break;
      case 2:
        if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
        if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
        if (formData.minimumOrderQuantity < 1) newErrors.minimumOrderQuantity = 'Minimum order quantity must be at least 1';
        break;
      case 3:
        if (!formData.whatsInTheBox.some(item => item.trim())) newErrors.whatsInTheBox = 'At least one item is required';
        if (!formData.aboutItem.some(item => item.trim())) newErrors.aboutItem = 'At least one item is required';
        break;
      case 4:
        if (formData.images.length === 0) newErrors.images = 'At least one image is required';
        break;
      case 5:
        if (formData.shippingInfo.weight <= 0) newErrors.shippingInfo = 'Weight must be greater than 0';
        if (!formData.shippingInfo.dimensions.length || 
            !formData.shippingInfo.dimensions.width || 
            !formData.shippingInfo.dimensions.height) {
          newErrors.shippingInfo = 'All dimensions are required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fix the errors before proceeding');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-gray-600">Step {currentStep} of 5</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Delete Product
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{submitError}</p>
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <ProductFormSteps
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleImageUpload={handleImageUpload}
          isUploading={isUploading}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1 || isSubmitting}
          className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>

        {currentStep < 5 ? (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              'Update Product'
            )}
          </button>
        )}
      </div>
    </div>
  );
} 