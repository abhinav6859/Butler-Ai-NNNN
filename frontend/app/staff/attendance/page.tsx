'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader, Badge, LoadingSpinner } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import api from '@/services/api';
import { Clock, CheckCircle } from 'lucide-react';

export default function StaffAttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = user?.staffId ? `&staffId=${user.staffId}` : '';
      const res = await api.get(`/attendance?page=${page}${params}`);
      setRecords(res.data.data);
      setPagination(res.data.pagination);
      // Find today
      const today = new Date().toISOString().split('T')[0];
      const todayRec = res.data.data.find((r: any) => r.date?.startsWith(today));
      setTodayRecord(todayRec || null);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const doCheckIn = async () => {
    setCheckinLoading(true);
    try { const res = await api.post('/attendance/check-in'); setTodayRecord(res.data); setMessage('✅ Checked in!'); fetchData(); }
    catch (e: any) { setMessage(e?.response?.data?.error || 'Failed'); }
    finally { setCheckinLoading(false); }
  };

  const doCheckOut = async () => {
    setCheckinLoading(true);
    try { const res = await api.post('/attendance/check-out'); setTodayRecord(res.data); setMessage('✅ Checked out!'); fetchData(); }
    catch (e: any) { setMessage(e?.response?.data?.error || 'Failed'); }
    finally { setCheckinLoading(false); }
  };

  const sColors: Record<string, any> = { PRESENT: 'success', ABSENT: 'danger', LEAVE: 'warning', LATE: 'warning' };

  const columns = [
    { key: 'date', label: 'Date', render: (r: any) => new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.status} variant={sColors[r.status]} /> },
    { key: 'checkIn', label: 'Check In', render: (r: any) => r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—' },
    { key: 'checkOut', label: 'Check Out', render: (r: any) => r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—' },
    { key: 'remarks', label: 'Remarks', render: (r: any) => r.remarks || '—' },
  ];

  return (
    <div>
      <PageHeader title="My Attendance" description="Track your daily work hours and attendance records" />

      {/* Today's quick status */}
      <div className="mb-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center space-x-2">
          <Clock size={18} className="text-indigo-500" />
          <span>Today</span>
        </h2>
        {message && <div className="mb-3 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl">{message}</div>}
        {todayRecord ? (
          <div className="flex items-center space-x-4">
            <Badge label={todayRecord.status} variant={sColors[todayRecord.status]} />
            {todayRecord.checkIn && <span className="text-sm text-slate-500">In: {new Date(todayRecord.checkIn).toLocaleTimeString()}</span>}
            {todayRecord.checkOut ? (
              <span className="flex items-center text-emerald-600 text-sm font-medium space-x-1"><CheckCircle size={14} /><span>Shift complete</span></span>
            ) : (
              <button onClick={doCheckOut} disabled={checkinLoading} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
                {checkinLoading ? 'Processing...' : 'Check Out'}
              </button>
            )}
          </div>
        ) : (
          <button onClick={doCheckIn} disabled={checkinLoading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm disabled:opacity-60 transition">
            {checkinLoading ? 'Processing...' : 'Check In for Today'}
          </button>
        )}
      </div>

      <DataTable columns={columns} data={records} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchData} searchPlaceholder="Filter attendance..." />
    </div>
  );
}
