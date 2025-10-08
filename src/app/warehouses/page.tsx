'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PickupAddress {
  addressType: 'primary' | 'secondary' | 'warehouse';
  buildingNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
}

interface PickupAddressFormData {
  addressType: 'primary' | 'secondary' | 'warehouse';
  buildingNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string;
}

export default function WarehousesPage() {
  const router = useRouter();
  const [pickupAddress, setPickupAddress] = useState<PickupAddress | null>(null);
  const [hasPickupAddress, setHasPickupAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  const [formData, setFormData] = useState<PickupAddressFormData>({
    addressType: 'warehouse',
    buildingNumber: '',
    streetName: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    landmark: '',
  });

  const checkSessionAndLoadPickupAddress = useCallback(async () => {
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

      await loadPickupAddress();
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('vendorToken');
      router.push('/auth/signin');
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  useEffect(() => {
    checkSessionAndLoadPickupAddress();
  }, [checkSessionAndLoadPickupAddress]);

  // Auto-show form if no pickup address is set
  useEffect(() => {
    if (!isLoading && !hasPickupAddress) {
      setShowAddForm(true);
    }
  }, [isLoading, hasPickupAddress]);


  const loadPickupAddress = async () => {
    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/warehouses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setPickupAddress(data.data.pickupAddress);
        setHasPickupAddress(data.data.hasPickupAddress);
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to load pickup address' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while loading pickup address' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      addressType: 'warehouse',
      buildingNumber: '',
      streetName: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      landmark: '',
    });
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', content: '' });

    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: data.message });
        resetForm();
        await loadPickupAddress();
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to save pickup address' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while saving pickup address' });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pickup address...</p>
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
                Pickup Address
              </h1>
              <p className="text-gray-600 mt-2 text-base sm:text-lg">
                {hasPickupAddress
                  ? 'Your pickup address for order fulfillment'
                  : 'Set your pickup address to start receiving orders'
                }
              </p>
            </div>
          </div>
        </div>

        {message.content && (
          <div className={`mb-6 p-4 rounded-xl shadow-lg transform transition-all duration-300 ${message.type === 'success'
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
          {/* Left Column - Pickup Address Form */}
          {showAddForm && (
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 sm:px-6 py-4 border-b border-indigo-200">
                  <h3 className="text-lg sm:text-xl font-semibold text-indigo-800">
                    Set Pickup Address
                  </h3>
                  <p className="text-indigo-600 text-sm">
                    Required to start receiving orders
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
                          <span>Set Pickup Address</span>
                        </>
                      )}
                    </button>
                    {hasPickupAddress && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Right Column - Pickup Address Display */}
          <div className={`${showAddForm ? 'lg:col-span-2' : 'lg:col-span-3'} order-1 lg:order-2`}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Your Pickup Address</h3>
                <p className="text-gray-600 text-sm">
                  {hasPickupAddress ? 'Pickup address is configured' : 'No pickup address set'}
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {!hasPickupAddress ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-amber-800 mb-2">Pickup Address Required</h3>
                    <p className="text-amber-600 mb-4 sm:mb-6 text-sm sm:text-base">
                      You must set a pickup address before you can receive orders. Please fill out the form on the left.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                      <p className="text-sm text-amber-700">
                        <strong>Note:</strong> Once set, your pickup address cannot be modified. Please ensure all details are correct.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 border border-indigo-200 bg-indigo-50 rounded-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                          {pickupAddress?.addressType}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {pickupAddress?.addressType}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Pickup Address</p>
                        <p className="text-xs text-gray-400">Cannot be modified once set</p>
                      </div>
                    </div>

                    <div className="text-gray-600 space-y-2 text-sm sm:text-base">
                      <p className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {pickupAddress?.buildingNumber}, {pickupAddress?.streetName}
                      </p>
                      <p className="ml-6">
                        {pickupAddress?.city}, {pickupAddress?.state} {pickupAddress?.postalCode}
                      </p>
                      <p className="ml-6">{pickupAddress?.country}</p>
                      {pickupAddress?.landmark && (
                        <p className="ml-6 text-xs sm:text-sm text-gray-500">
                          Near: {pickupAddress.landmark}
                        </p>
                      )}
                    </div>
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