'use client';

import { useEffect, useState } from 'react';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import api from '@/services/api';
import { BellRing } from 'lucide-react';

const typeVariants: Record<string, any> = {
  TASK_ASSIGNED: 'indigo', TASK_COMPLETED: 'success', VISITOR_ARRIVED: 'warning',
  LOW_STOCK: 'danger', GROCERY_REQUEST: 'warning', SUMMARY: 'default', MEAL_READY: 'success',
};

export default function AdminNotificationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${page}&limit=15`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { key: 'title', label: 'Title', render: (r: any) => (
      <div className="flex items-center space-x-2">
        <BellRing size={14} className="text-indigo-500 shrink-0" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">{r.title}</span>
      </div>
    )},
    { key: 'type', label: 'Type', render: (r: any) => <Badge label={r.type.replace(/_/g,' ')} variant={typeVariants[r.type]} /> },
    { key: 'message', label: 'Message', render: (r: any) => <span className="text-xs text-slate-500 line-clamp-2">{r.message}</span> },
    { key: 'user', label: 'Recipient', render: (r: any) => r.user?.name || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.status} variant={r.status === 'DELIVERED' ? 'success' : 'warning'} /> },
    { key: 'createdAt', label: 'Sent At', render: (r: any) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader
        title="WhatsApp Notifications"
        description="Complete log of all dispatched household alerts"
      />
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchData}
        searchPlaceholder="Search notifications..."
      />
    </div>
  );
}
