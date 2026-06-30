'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Badge, LoadingSpinner } from '@/components/ui';
import api from '@/services/api';
import { UserCheck } from 'lucide-react';

export default function HonourStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/staff?limit=50')
      .then((res) => setStaff(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, any> = { ACTIVE: 'success', ON_LEAVE: 'warning', INACTIVE: 'danger' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Staff Status" description="Overview of all household staff members and their current status" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s: any) => (
          <div key={s.id} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                {s.name?.[0]?.toUpperCase() || '?'}
              </div>
              <Badge label={s.status} variant={statusColor[s.status] || 'default'} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{s.staffType}</p>
            {s.phone && <p className="text-xs text-slate-400 mt-1">📞 {s.phone}</p>}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Since {new Date(s.joinedDate).toLocaleDateString()}</span>
              {s.salary && <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">₹{s.salary.toLocaleString()}/mo</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
