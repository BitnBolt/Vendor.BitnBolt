'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Warehouse {
  _id: string;
  addressType: 'primary' | 'secondary' | 'warehouse';
  addressName: string;
  buildingNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
}

interface WarehouseFormData {
  addressType: 'primary' | 'secondary' | 'warehouse';
  addressName: string;
  buildingNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string;
  isDefault: boolean;
}

export default function WarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const [formData, setFormData] = useState<WarehouseFormData>({
    addressType: 'warehouse',
    addressName: '',
    buildingNumber: '',
    streetName: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    landmark: '',
    isDefault: false,
  });

  useEffect(() => {
    checkSessionAndLoadWarehouses();
  }, []);

  const checkSessionAndLoadWarehouses = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/session`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('vendorToken');
        router.push('/auth/signin');
        return;
      }

      await loadWarehouses();
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('vendorToken');
      router.push('/auth/signin');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/warehouses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setWarehouses(data.data.warehouses);
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to load warehouses' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while loading warehouses' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      addressType: 'warehouse',
      addressName: '',
      buildingNumber: '',
      streetName: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      landmark: '',
      isDefault: false,
    });
    setEditingWarehouse(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', content: '' });

    try {
      const token = localStorage.getItem('vendorToken');
      const url = editingWarehouse 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/warehouses`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/warehouses`;
      
      const body = editingWarehouse 
        ? { ...formData, warehouseId: editingWarehouse._id }
        : formData;

      const response = await fetch(url, {
        method: editingWarehouse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: data.message });
        resetForm();
        await loadWarehouses();
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to save warehouse' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while saving warehouse' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      addressType: warehouse.addressType,
      addressName: warehouse.addressName,
      buildingNumber: warehouse.buildingNumber,
      streetName: warehouse.streetName,
      city: warehouse.city,
      state: warehouse.state,
      postalCode: warehouse.postalCode,
      country: warehouse.country,
      landmark: warehouse.landmark || '',
      isDefault: warehouse.isDefault,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (warehouseId: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) {
      return;
    }

    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/warehouses?id=${warehouseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: data.message });
        await loadWarehouses();
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to delete warehouse' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while deleting warehouse' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Warehouse Management
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">Manage your warehouse locations and pickup addresses</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Warehouse</span>
            </button>
          </div>
        </div>

        {message.content && (
          <div className={`mb-6 p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700' 
              : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {message.content}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Warehouse Form */}
          {showAddForm && (
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {editingWarehouse ? 'Update warehouse details' : 'Add a new warehouse location'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                  {/* Address Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Type *
                    </label>
                    <select
                      name="addressType"
                      value={formData.addressType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="primary">Primary Address</option>
                      <option value="secondary">Secondary Address</option>
                    </select>
                  </div>

                  {/* Address Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Name *
                    </label>
                    <input
                      type="text"
                      name="addressName"
                      value={formData.addressName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Main Warehouse, Branch Office"
                      required
                    />
                  </div>

                  {/* Building Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Building/House Number *
                    </label>
                    <input
                      type="text"
                      name="buildingNumber"
                      value={formData.buildingNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., 123, A-15"
                      required
                    />
                  </div>

                  {/* Street Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Name *
                    </label>
                    <input
                      type="text"
                      name="streetName"
                      value={formData.streetName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Main Street, Industrial Area"
                      required
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Mumbai, Delhi"
                      required
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Maharashtra, Delhi"
                      required
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., 400001"
                      required
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., India"
                      required
                    />
                  </div>

                  {/* Landmark */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="e.g., Near Metro Station, Behind Mall"
                    />
                  </div>

                  {/* Default Address */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Set as default address
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{editingWarehouse ? 'Update' : 'Add'} Warehouse</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Right Column - Warehouse List */}
          <div className={`${showAddForm ? 'lg:col-span-2' : 'lg:col-span-3'} order-1 lg:order-2`}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Your Warehouses</h3>
                <p className="text-gray-600 text-sm">
                  {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {warehouses.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No warehouses yet</h3>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Add your first warehouse to get started</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add First Warehouse</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {warehouses.map((warehouse) => (
                      <div
                        key={warehouse._id}
                        className={`p-4 sm:p-6 border rounded-xl transition-all duration-200 ${
                          warehouse.isDefault
                            ? 'border-indigo-200 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                              <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                {warehouse.addressName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  warehouse.addressType === 'warehouse'
                                    ? 'bg-blue-100 text-blue-800'
                                    : warehouse.addressType === 'primary'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {warehouse.addressType.charAt(0).toUpperCase() + warehouse.addressType.slice(1)}
                                </span>
                                {warehouse.isDefault && (
                                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-gray-600 space-y-1 text-sm sm:text-base">
                              <p>
                                {warehouse.buildingNumber}, {warehouse.streetName}
                              </p>
                              <p>
                                {warehouse.city}, {warehouse.state} {warehouse.postalCode}
                              </p>
                              <p>{warehouse.country}</p>
                              {warehouse.landmark && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Near: {warehouse.landmark}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-end sm:justify-start space-x-2 sm:ml-4">
                            <button
                              onClick={() => handleEdit(warehouse)}
                              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                              title="Edit warehouse"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(warehouse._id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete warehouse"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 