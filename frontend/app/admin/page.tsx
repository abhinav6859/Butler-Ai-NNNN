'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StatCard, PageHeader, LoadingSpinner, Badge } from '@/components/ui';
import api from '@/services/api';
import {
  Users, Home, UserCheck, ClipboardList,
  BellRing, TrendingUp, ShieldAlert, Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users?limit=1'),
      api.get('/homes?limit=1'),
      api.get('/staff?limit=1'),
      api.get('/tasks?limit=1'),
      api.get('/notifications?limit=5'),
    ])
      .then(([users, homes, staff, tasks, notifs]) => {
        setStats({
          users: users.data.pagination?.total || 0,
          homes: homes.data.pagination?.total || 0,
          staff: staff.data.pagination?.total || 0,
          tasks: tasks.data.pagination?.total || 0,
        });
        setRecentNotifications(notifs.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const typeVariants: Record<string, any> = {
    TASK_ASSIGNED: 'indigo',
    TASK_COMPLETED: 'success',
    VISITOR_ARRIVED: 'warning',
    LOW_STOCK: 'danger',
    GROCERY_REQUEST: 'warning',
    SUMMARY: 'default',
  };

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        description="Full system overview and management controls"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Users" value={stats?.users ?? 0} icon={<Users size={22} />} color="indigo" />
        <StatCard title="Managed Homes" value={stats?.homes ?? 0} icon={<Home size={22} />} color="purple" />
        <StatCard title="Active Staff" value={stats?.staff ?? 0} icon={<UserCheck size={22} />} color="emerald" />
        <StatCard title="Total Tasks" value={stats?.tasks ?? 0} icon={<ClipboardList size={22} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="glass-card bg-white dark:bg-slate-900/50 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
            <Activity size={18} className="text-indigo-500" />
            <span>Quick Actions</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Users', href: '/admin/users', icon: <Users size={18} />, color: 'bg-indigo-500' },
              { label: 'Manage Homes', href: '/admin/homes', icon: <Home size={18} />, color: 'bg-purple-500' },
              { label: 'Manage Staff', href: '/admin/staff', icon: <UserCheck size={18} />, color: 'bg-emerald-500' },
              { label: 'View Reports', href: '/admin/reports', icon: <TrendingUp size={18} />, color: 'bg-amber-500' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-700 transition group"
              >
                <div className={`${item.color} p-2 rounded-lg text-white shadow-sm`}>{item.icon}</div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="glass-card bg-white dark:bg-slate-900/50 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
            <BellRing size={18} className="text-indigo-500" />
            <span>Recent WhatsApp Alerts</span>
          </h2>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-600 text-center py-8">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((n: any) => (
                <div key={n.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="mt-0.5">
                    <ShieldAlert size={14} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{n.title}</p>
                      <Badge label={n.type} variant={typeVariants[n.type] || 'default'} />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
