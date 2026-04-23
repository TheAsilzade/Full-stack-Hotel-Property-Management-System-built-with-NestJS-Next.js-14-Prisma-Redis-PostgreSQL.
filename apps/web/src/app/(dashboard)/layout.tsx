'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useWebSocketQuerySync } from '@/lib/hooks/useWebSocket';

function WebSocketSync() {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0];
  useWebSocketQuerySync(propertyId);
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, tokens, _hydrated } = useAuthStore();

  useEffect(() => {
    if (_hydrated && (!tokens?.accessToken || !user)) {
      router.replace('/login');
    }
  }, [_hydrated, tokens, user, router]);

  if (!_hydrated || !tokens?.accessToken || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center">
            <span className="text-white font-bold font-display">L</span>
          </div>
          <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <WebSocketSync />
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}