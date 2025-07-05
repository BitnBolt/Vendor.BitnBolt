'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VendorData {
  id: string;
  email: string;
  seller_name: string;
  phone: string;
  shopName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  approved: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('vendorToken');
        
        if (!token) {
          router.push('/auth/signin');
          return;
        }

        // Verify session with backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/session`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token is invalid or expired
          localStorage.removeItem('vendorToken');
          router.push('/auth/signin');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setVendor(data.data.vendor);
        } else {
          // Session verification failed
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return null; // Will redirect to login
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {vendor.seller_name}!</h1>
        <p className="text-gray-600 mt-2">Manage your products, orders, and business</p>
      </div>

      {/* Verification Status */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            vendor.emailVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {vendor.emailVerified ? '✓ Email Verified' : '⚠ Email Not Verified'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            vendor.phoneVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {vendor.phoneVerified ? '✓ Phone Verified' : '⚠ Phone Not Verified'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            vendor.approved 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {vendor.approved ? '✓ Account Approved' : '⚠ Pending Approval'}
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-gray-500 text-sm font-medium">Total Orders</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">123</div>
          <div className="text-green-600 text-sm mt-1">+12% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-gray-500 text-sm font-medium">Pending Orders</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">8</div>
          <div className="text-orange-600 text-sm mt-1">Requires attention</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-gray-500 text-sm font-medium">Revenue</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">₹12,300</div>
          <div className="text-green-600 text-sm mt-1">+8% from last month</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors">
          <div className="text-lg font-semibold">Add Product</div>
          <div className="text-sm opacity-90">Create new listing</div>
        </button>
        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
          <div className="text-lg font-semibold">View Orders</div>
          <div className="text-sm opacity-90">Manage orders</div>
        </button>
        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
          <div className="text-lg font-semibold">Analytics</div>
          <div className="text-sm opacity-90">View insights</div>
        </button>
        <button className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 transition-colors">
          <div className="text-lg font-semibold">Settings</div>
          <div className="text-sm opacity-90">Account settings</div>
        </button>
      </div>
    </div>
  );
}
