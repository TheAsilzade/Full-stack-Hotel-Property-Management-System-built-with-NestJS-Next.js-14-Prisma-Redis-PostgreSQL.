import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold gold-text">Noblesse PMS</h1>
          <p className="text-charcoal-400 text-sm mt-1">Hotel Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}