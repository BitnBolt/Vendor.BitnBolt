'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ProductFormSteps from '@/components/ProductForm/Steps';
import { ProductFormData, ProductFormErrors } from '@/components/ProductForm/types';

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  subCategory: '',
  brand: '',
  basePrice: 0,
  stock: 0,
  minimumOrderQuantity: 1,
  whatsInTheBox: [],
  aboutItem: [],
  features: [],
  specifications: [],
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
  replacePolicy: {
    isReplaceable: false,
    replaceWindow: 7,
    replaceConditions: [''],
  },
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<ProductFormErrors>({});
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
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch product');
        }

        const data = await response.json();
        setFormData(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        toast.error('Please fix the highlighted fields');
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
        replacePolicy: {
          ...formData.replacePolicy,
          replaceConditions: formData.replacePolicy.replaceConditions.filter(c => c.trim()),
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
      formData.append('productId', params.id as string);

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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      router.push('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';

    if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (formData.minimumOrderQuantity < 1) {
      newErrors.minimumOrderQuantity = 'Minimum order quantity must be at least 1';
    }

    if (formData.images.length === 0) newErrors.images = 'At least one image is required';

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
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit product</h1>
          <p className="text-sm text-gray-600">Update any section below, then save.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>

      {submitError && (
        <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">{submitError}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-5">
        <ProductFormSteps
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleImageUpload={handleImageUpload}
          isUploading={isUploading}
          isEditing={true}
          productId={params.id as string}
        />

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 