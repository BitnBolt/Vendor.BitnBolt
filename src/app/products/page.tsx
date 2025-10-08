'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Switch } from '@headlessui/react';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description: string;
  images: string[];
  basePrice: number;
  finalPrice: number;
  profitMargin: number;
  discount: number;
  category: string;
  subCategory?: string;
  brand: string;
  stock: number;
  minimumOrderQuantity: number;
  isPublished: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  stats: {
    views: number;
    sales: number;
  };
  rating: {
    average: number;
    count: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface Filters {
  categories: string[];
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [publishedFilter, setPublishedFilter] = useState<string>(searchParams.get('isPublished') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('vendorToken');
      
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
      });

      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory) params.set('category', selectedCategory);
      if (publishedFilter) params.set('isPublished', publishedFilter);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/list?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [router, searchTerm, selectedCategory, publishedFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleTogglePublish = async (productId: string, currentState: boolean) => {
    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/${productId}/toggle-publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle publish status');
      }

      setProducts(products.map(product => 
        product._id === productId 
          ? { ...product, isPublished: !currentState }
          : product
      ));

      toast.success(`Product ${currentState ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Failed to update publish status');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/${productId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(product => product._id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleSort = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => router.push('/products/add')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {filters?.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>

          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => handleSort(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="views-desc">Most Viewed</option>
              <option value="sales-desc">Best Selling</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="stock-asc">Low Stock First</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No products found. Start by adding a new product.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 group"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={product.images[0] || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.discount > 0 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{product.discount}%
                    </div>
                  )}
                  {product.isSuspended && (
                    <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-xs py-1 text-center">
                      Suspended
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-base font-semibold text-gray-800 line-clamp-1">
                      {product.name}
                    </h2>
                    <Switch
                      checked={product.isPublished}
                      onChange={() => handleTogglePublish(product._id, product.isPublished)}
                      disabled={product.isSuspended}
                      className={`${
                        product.isPublished ? 'bg-green-500' : 'bg-gray-200'
                      } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50`}
                    >
                      <span
                        className={`${
                          product.isPublished ? 'translate-x-5' : 'translate-x-1'
                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{product.category}</span>
                    {product.subCategory && (
                      <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded-full">{product.subCategory}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 font-medium">{product.rating.average.toFixed(1)}</span>
                      <span className="ml-1 text-gray-400">({product.rating.count})</span>
                    </div>
                    <div>
                      {/* <span className="text-xs text-gray-400 line-through">₹{product.basePrice}</span> */}
                      <span className="ml-1 font-bold text-indigo-600">₹{product.basePrice}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mb-3">
                    <div className="text-center bg-gray-50 rounded p-1">
                      <p className="text-xs text-gray-500">Stock</p>
                      <p className="text-xs font-semibold">{product.stock}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded p-1">
                      <p className="text-xs text-gray-500">Min</p>
                      <p className="text-xs font-semibold">{product.minimumOrderQuantity}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded p-1">
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-xs font-semibold">{product.stats.views}</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded p-1">
                      <p className="text-xs text-gray-500">Sales</p>
                      <p className="text-xs font-semibold">{product.stats.sales}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/products/${product._id}`)}
                      className="flex-1 px-2 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => router.push(`/products/edit/${product._id}`)}
                      className="flex-1 px-2 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                      disabled={product.isSuspended}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="px-2 py-1.5 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                      disabled={product.isSuspended}
                      aria-label="Delete product"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => fetchProducts(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProducts(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
} 