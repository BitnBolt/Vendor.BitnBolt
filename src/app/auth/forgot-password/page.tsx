'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type Step = 'email' | 'otp' | 'password';

export default function VendorForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/forgot-password/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('OTP sent to your email!');
                setStep('otp');
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/forgot-password/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email, otp: formData.otp }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('OTP verified successfully!');
                setStep('password');
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/forgot-password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: formData.email, 
                    otp: formData.otp, 
                    newPassword: formData.newPassword 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    router.push('/auth/signin');
                }, 2000);
            } else {
                setError(data.message || 'Failed to reset password');
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

    const renderStep = () => {
        switch (step) {
            case 'email':
                return (
                    <form onSubmit={handleSendOTP} className="space-y-6">
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
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                );

            case 'otp':
                return (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                Enter OTP
                            </label>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                value={formData.otp}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('email')}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to Email
                        </button>
                    </form>
                );

            case 'password':
                return (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter new password (min 6 characters)"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Confirm new password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('otp')}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Back to OTP
                        </button>
                    </form>
                );
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'email':
                return 'Reset Password';
            case 'otp':
                return 'Verify OTP';
            case 'password':
                return 'Set New Password';
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 'email':
                return 'Enter your email to receive a password reset OTP';
            case 'otp':
                return 'Enter the 6-digit OTP sent to your email';
            case 'password':
                return 'Create a new password for your account';
        }
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

            {/* Right Side - Form */}
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
                            <h1 className="text-3xl font-bold text-gray-900">{getStepTitle()}</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                {getStepDescription()}
                            </p>
                        </div>

                        <div className="mt-8">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-6">
                                    {success}
                                </div>
                            )}

                            {renderStep()}
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-gray-600">
                                Remember your password?{" "}
                                <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 