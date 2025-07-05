'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface VendorData {
  id: string;
  email: string;
  seller_name: string;
  phone: string;
  shopName: string;
  gstNumber?: string;
  pickupAddresses: Array<{
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
  }>;
  emailVerified: boolean;
  phoneVerified: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    seller_name: '',
    shopName: '',
    gstNumber: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [imageUploading, setImageUploading] = useState(false);
  const [, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
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

        const data = await response.json();
        if (data.success) {
          setVendor(data.data.vendor);
          setEditData({
            seller_name: data.data.vendor.seller_name,
            shopName: data.data.vendor.shopName,
            gstNumber: data.data.vendor.gstNumber || ''
          });
        } else {
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('vendorToken');
        router.push('/auth/signin');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', content: '' });

    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: 'Profile updated successfully!' });
        setIsEditing(false);
        // Refresh vendor data
        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/session`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setVendor(sessionData.data.vendor);
        }
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      seller_name: vendor?.seller_name || '',
      shopName: vendor?.shopName || '',
      gstNumber: vendor?.gstNumber || ''
    });
    setMessage({ type: '', content: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    setMessage({ type: '', content: '' });
    try {
      const token = localStorage.getItem('vendorToken');
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/profile/image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', content: 'Profile image updated!' });
        setVendor((prev) => prev ? { ...prev, profileImage: data.data.profileImage } : prev);
        setImagePreview(null);
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to upload image' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while uploading image' });
    } finally {
      setImageUploading(false);
    }
  };

  // Handle image remove
  const handleRemoveImage = async () => {
    setImageUploading(true);
    setMessage({ type: '', content: '' });
    try {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/profile/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', content: 'Profile image removed!' });
        setVendor((prev) => prev ? { ...prev, profileImage: undefined } : prev);
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to remove image' });
      }
    } catch {
      setMessage({ type: 'error', content: 'An error occurred while removing image' });
    } finally {
      setImageUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    router.push('/auth/signin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage your account and business information</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {vendor?.profileImage ? (
                  <Image
                    src={vendor.profileImage}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <span>{vendor.seller_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm overflow-hidden">
                      {imageUploading ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      ) : vendor?.profileImage ? (
                        <Image
                          src={vendor.profileImage}
                          alt="Profile"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-white">{vendor.seller_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    
                    {/* Upload button for mobile */}
                    <label 
                      htmlFor="profile-image-upload-mobile" 
                      className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-purple-600 text-white rounded-full p-1.5 cursor-pointer shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-30 border-2 border-white"
                      title="Upload new image"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <input
                        id="profile-image-upload-mobile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={imageUploading}
                      />
                    </label>
                    
                    {/* Remove button for mobile */}
                    {vendor?.profileImage && !imageUploading && (
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-1 -left-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-30 border-2 border-white"
                        title="Remove profile image"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{vendor.seller_name}</h2>
                    <p className="text-indigo-100">{vendor.shopName}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-semibold">{formatDate(vendor.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Warehouses</p>
                      <p className="font-semibold">{vendor.pickupAddresses.length} locations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                vendor.emailVerified 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    vendor.emailVerified ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {vendor.emailVerified ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-sm">{vendor.emailVerified ? 'Verified' : 'Pending'}</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                vendor.phoneVerified 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    vendor.phoneVerified ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {vendor.phoneVerified ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-sm">{vendor.phoneVerified ? 'Verified' : 'Pending'}</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                vendor.approved 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    vendor.approved ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {vendor.approved ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">Account</p>
                    <p className="text-sm">{vendor.approved ? 'Approved' : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Profile Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Business Information</h3>
                <p className="text-gray-600 text-sm">Update your business details and preferences</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seller Name */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Seller Name *</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.seller_name}
                        onChange={(e) => setEditData({...editData, seller_name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl">
                        <p className="text-gray-900 font-medium">{vendor.seller_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Shop Name */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Shop Name *</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.shopName}
                        onChange={(e) => setEditData({...editData, shopName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl">
                        <p className="text-gray-900 font-medium">{vendor.shopName}</p>
                      </div>
                    )}
                  </div>

                  {/* GST Number */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>GST Number</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.gstNumber}
                        onChange={(e) => setEditData({...editData, gstNumber: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter GST number"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl">
                        <p className="text-gray-900 font-medium">{vendor.gstNumber || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Email Address</span>
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <p className="text-gray-900 font-medium">{vendor.email}</p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Phone Number</span>
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <p className="text-gray-900 font-medium">{vendor.phone}</p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Member Since</span>
                    </label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <p className="text-gray-900 font-medium">{formatDate(vendor.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 shadow-lg"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 