'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardShell from '@/components/layout/DashboardShell';
import { LoadingSpinner } from '@/components/ui';

export default function HonourLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'HONOUR')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!user || user.role !== 'HONOUR') return null;

  return <DashboardShell>{children}</DashboardShell>;
}
