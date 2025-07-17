'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  brand: string;
  whatsInTheBox: string[];
  aboutItem: string[];
  features: Array<{ key: string; value: string }>;
  specifications: Array<{ key: string; value: string }>;
  tags: string[];
  images: string[];
  basePrice: number;
  finalPrice: number;
  profitMargin: number;
  discount: number;
  stock: number;
  minimumOrderQuantity: number;
  isPublished: boolean;
  shippingInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  returnPolicy: {
    isReturnable: boolean;
    returnWindow: number;
    returnConditions: string[];
  };
  stats: {
    views: number;
    sales: number;
  };
  rating: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        setProduct(data.product);
        if (data.product.images.length > 0) {
          setSelectedImage(data.product.images[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`/api/vendor/products/${params.id}/delete`, {
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
    }
  };

  const handleTogglePublish = async () => {
    if (!product) return;

    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`/api/vendor/products/${params.id}/toggle-publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle publish status');
      }

      setProduct({
        ...product,
        isPublished: !product.isPublished,
      });

      toast.success(`Product ${product.isPublished ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Category: <span className="font-medium">{product.category}</span>
              {product.subCategory && ` / ${product.subCategory}`}
            </span>
            <span className="text-sm text-gray-600">
              Brand: <span className="font-medium">{product.brand}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2 rounded-lg ${
              product.isPublished
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {product.isPublished ? 'Published' : 'Unpublished'}
          </button>
          <button
            onClick={() => router.push(`/products/edit/${product._id}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Edit Product
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
            <Image
              src={selectedImage || product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-5 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(image)}
                className={`relative aspect-square rounded-lg overflow-hidden ${
                  selectedImage === image ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-8">
          {/* Pricing & Stock */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pricing & Stock</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Base Price</p>
                <p className="text-lg font-semibold">₹{product.basePrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Final Price</p>
                <p className="text-lg font-semibold">₹{product.finalPrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-lg font-semibold">{product.profitMargin}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount</p>
                <p className="text-lg font-semibold">{product.discount}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock</p>
                <p className="text-lg font-semibold">{product.stock}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Minimum Order</p>
                <p className="text-lg font-semibold">{product.minimumOrderQuantity}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Views</p>
                <p className="text-lg font-semibold">{product.stats.views}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sales</p>
                <p className="text-lg font-semibold">{product.stats.sales}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-semibold">{product.rating.average.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">({product.rating.count})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* What's in the Box */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What's in the Box</h2>
            <ul className="list-disc list-inside space-y-2">
              {product.whatsInTheBox.map((item, index) => (
                <li key={index} className="text-gray-600">{item}</li>
              ))}
            </ul>
          </div>

          {/* About Item */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About this Item</h2>
            <ul className="list-disc list-inside space-y-2">
              {product.aboutItem.map((item, index) => (
                <li key={index} className="text-gray-600">{item}</li>
              ))}
            </ul>
          </div>

          {/* Features */}
          {product.features.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Features</h2>
              <div className="grid grid-cols-2 gap-4">
                {product.features.map((feature, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-800">{feature.key}</p>
                    <p className="text-gray-600">{feature.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specifications.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                {product.specifications.map((spec, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-800">{spec.key}</p>
                    <p className="text-gray-600">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Weight</p>
                <p className="text-lg font-semibold">{product.shippingInfo.weight}g</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dimensions</p>
                <p className="text-lg font-semibold">
                  {product.shippingInfo.dimensions.length} × {product.shippingInfo.dimensions.width} × {product.shippingInfo.dimensions.height} cm
                </p>
              </div>
            </div>
          </div>

          {/* Return Policy */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Return Policy</h2>
            {product.returnPolicy.isReturnable ? (
              <>
                <p className="text-gray-600 mb-4">
                  Returns accepted within {product.returnPolicy.returnWindow} days
                </p>
                {product.returnPolicy.returnConditions.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-800 mb-2">Conditions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {product.returnPolicy.returnConditions.map((condition, index) => (
                        <li key={index} className="text-gray-600">{condition}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-600">Returns not accepted for this product</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-sm text-gray-500">
            <p>Created: {new Date(product.createdAt).toLocaleString()}</p>
            <p>Last Updated: {new Date(product.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 