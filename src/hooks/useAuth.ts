import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/auth/signin');
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem('vendorToken');
    router.push('/auth/signin');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('vendorToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('vendorToken');
    if (!token) {
      router.push('/auth/signin');
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('vendorToken');
      router.push('/auth/signin');
      throw new Error('Authentication expired');
    }

    return response;
  };

  return {
    isAuthenticated,
    loading,
    logout,
    getAuthHeaders,
    makeAuthenticatedRequest,
  };
}
