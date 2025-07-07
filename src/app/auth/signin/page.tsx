'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function VendorSignInPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [suspensionData, setSuspensionData] = useState<{
        suspended: boolean;
        suspensionReason: string;
        email: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        setSuspensionData(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Login successful! Redirecting...');
                // Store token in localStorage
                localStorage.setItem('vendorToken', data.data.token);
                // Redirect to dashboard
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } else {
                // Check if account is suspended
                if (response.status === 403 && data.data?.suspended) {
                    setSuspensionData(data.data);
                } else {
                    setError(data.message || 'Login failed');
                }
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image Section */}
            <div className="hidden lg:block lg:w-1/2 fixed left-0 h-screen">
                <Image
                    src="https://images.unsplash.com/photo-1579403124614-197f69d8187b"
                    alt="Authentication background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-indigo-600/10 backdrop-blur-[2px]"></div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="flex-1 min-h-screen overflow-y-auto lg:ml-[50%]">
                <div className="flex items-center justify-center p-8 sm:p-12">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center">
                            <Image
                                src="/vercel.svg"
                                alt="Logo"
                                width={60}
                                height={60}
                                className="mx-auto mb-4"
                            />
                            <h1 className="text-3xl font-bold text-gray-900">Welcome back, Vendor</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Please sign in to your vendor account
                            </p>
                        </div>

                        <div className="mt-8 relative">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                                        {success}
                                    </div>
                                )}
                                
                                {suspensionData && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Account Suspended
                                                </h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p className="mb-2">
                                                        <strong>Reason:</strong> {suspensionData.suspensionReason}
                                                    </p>
                                                    <p className="mb-3">
                                                        Your account has been suspended. Please contact our support team for assistance.
                                                    </p>
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <a
                                                            href={`mailto:support@bitnbolt.in?subject=Account Suspension - ${suspensionData.email}&body=Hello,%0D%0A%0D%0AMy account has been suspended and I need assistance.%0D%0A%0D%0AEmail: ${suspensionData.email}%0D%0AReason: ${suspensionData.suspensionReason}%0D%0A%0D%0APlease help me resolve this issue.%0D%0A%0D%0AThank you.`}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            Contact Support
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                setSuspensionData(null);
                                                                setFormData({ email: '', password: '' });
                                                            }}
                                                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                                                        >
                                                            Try Different Account
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={suspensionData ? 'pointer-events-none opacity-50' : ''}>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Enter your password"
                                        />
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Signing in...' : 'Sign in'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="mt-6 flex flex-col space-y-4 text-center text-sm">
                            <p className="text-gray-600">
                                Don&apos;t have a vendor account?{" "}
                                <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                                    Sign up
                                </Link>
                            </p>
                            <Link 
                                href="/auth/forgot-password" 
                                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 