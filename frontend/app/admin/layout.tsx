'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DashboardShell from '@/components/layout/DashboardShell';
import { LoadingSpinner } from '@/components/ui';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!user || user.role !== 'ADMIN') return null;

  return <DashboardShell>{children}</DashboardShell>;
}
