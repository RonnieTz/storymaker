'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100">
      <main className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">StoryMaker</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          Create interactive stories with AI assistance. Let your imagination
          run wild as you craft unique narratives together with artificial
          intelligence.
        </p>

        {session ? (
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        ) : (
          <div className="space-y-4">
            <div className="space-x-4">
              <Link
                href="/auth/signin"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/auth/signup"
                className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-3">or</p>
              <Link
                href="/story/guest"
                className="inline-flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Try as Guest (stories won&apos;t be saved)
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
