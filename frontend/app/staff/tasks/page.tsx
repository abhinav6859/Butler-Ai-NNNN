'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import api from '@/services/api';

const pColors: Record<string, any> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'danger', URGENT: 'danger' };
const sColors: Record<string, any> = { PENDING: 'warning', IN_PROGRESS: 'indigo', COMPLETED: 'success', CANCELLED: 'danger' };

export default function StaffTasksPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = user?.staffId ? `&assignedStaffId=${user.staffId}` : '';
      const res = await api.get(`/tasks?page=${page}${params}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch { } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [user]);

  const updateStatus = async (row: any, status: string) => {
    try {
      await api.put(`/tasks/${row.id}`, { status, remarks: status === 'COMPLETED' ? 'Completed by staff' : undefined });
      fetchData(pagination.page);
    } catch {}
  };

  const columns = [
    { key: 'title', label: 'Task Title', render: (r: any) => <span className="font-semibold text-slate-700 dark:text-slate-200">{r.title}</span> },
    { key: 'category', label: 'Category', render: (r: any) => <Badge label={r.category} /> },
    { key: 'priority', label: 'Priority', render: (r: any) => <Badge label={r.priority} variant={pColors[r.priority]} /> },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.status.replace('_',' ')} variant={sColors[r.status]} /> },
    { key: 'dueDate', label: 'Due Date', render: (r: any) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
    { key: 'actions', label: 'Quick Action', render: (r: any) => (
      <div className="flex space-x-2">
        {r.status === 'PENDING' && (
          <button onClick={() => updateStatus(r, 'IN_PROGRESS')} className="text-xs px-2.5 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 transition">
            Start
          </button>
        )}
        {r.status === 'IN_PROGRESS' && (
          <button onClick={() => updateStatus(r, 'COMPLETED')} className="text-xs px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition">
            Complete
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="My Tasks" description="All tasks assigned to you" />
      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchData} searchPlaceholder="Search my tasks..." />
    </div>
  );
}
