'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function VendorVerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const token = searchParams.get('token');
                if (!token) {
                    setStatus('error');
                    setMessage('Verification token is missing');
                    return;
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/varify-email/varify?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully!');
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        router.push('/auth/signin');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Failed to verify email');
                }
            } catch {
                setStatus('error');
                setMessage('An error occurred during verification');
            }
        };

        verifyEmail();
    }, [searchParams, router]);

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

            {/* Right Side - Verification Status */}
            <div className="flex-1 min-h-screen overflow-y-auto lg:ml-[50%]">
                <div className="flex items-center justify-center p-8 sm:p-12">
                    <div className="w-full max-w-md space-y-8 text-center">
                        <div>
                            <Image
                                src="/vercel.svg"
                                alt="Logo"
                                width={60}
                                height={60}
                                className="mx-auto mb-4"
                            />
                            <h1 className="text-3xl font-bold text-gray-900">Email Verification</h1>
                        </div>

                        <div className="mt-8">
                            {status === 'loading' && (
                                <div className="space-y-4">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="text-gray-600">Verifying your email...</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="space-y-4">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
                                    <p className="text-gray-600">{message}</p>
                                    <p className="text-sm text-gray-500">Redirecting to login page...</p>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="space-y-4">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
                                    <p className="text-gray-600">{message}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-4">
                            <Link
                                href="/auth/signin"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Go to Sign In
                            </Link>
                            <div className="text-sm text-gray-600">
                                <p>
                                    Need help?{" "}
                                    <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Contact support
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function VendorVerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <VendorVerifyEmailContent />
        </Suspense>
    );
} 