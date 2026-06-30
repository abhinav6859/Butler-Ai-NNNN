'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader, StatCard, Badge, LoadingSpinner } from '@/components/ui';
import api from '@/services/api';
import { ClipboardList, UserCheck, Clock, CheckCircle } from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/tasks?assignedStaffId=${user?.staffId}&status=PENDING&limit=5`),
      api.get(`/attendance?staffId=${user?.staffId}&date=${new Date().toISOString().split('T')[0]}&limit=1`),
    ])
      .then(([taskRes, attendRes]) => {
        setTasks(taskRes.data.data || []);
        setAttendance(attendRes.data.data?.[0] || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const doCheckIn = async () => {
    setCheckinLoading(true);
    try {
      const res = await api.post('/attendance/check-in');
      setAttendance(res.data);
      setMessage('✅ Checked in successfully!');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Check-in failed');
    } finally { setCheckinLoading(false); }
  };

  const doCheckOut = async () => {
    setCheckinLoading(true);
    try {
      const res = await api.post('/attendance/check-out');
      setAttendance(res.data);
      setMessage('✅ Checked out successfully!');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Check-out failed');
    } finally { setCheckinLoading(false); }
  };

  const pColors: Record<string, any> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'danger', URGENT: 'danger' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={`Good Day, ${user?.name}`} description={`${user?.staffType} Dashboard`} />

      {/* Attendance Card */}
      <div className="mb-6 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
          <Clock size={18} className="text-indigo-500" />
          <span>Today's Attendance</span>
        </h2>
        {message && (
          <div className="mb-4 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl">{message}</div>
        )}
        <div className="flex items-center space-x-4">
          {attendance ? (
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Badge label={attendance.status} variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'LATE' ? 'warning' : 'danger'} />
                {attendance.checkIn && <span className="text-sm text-slate-500">In: {new Date(attendance.checkIn).toLocaleTimeString()}</span>}
                {attendance.checkOut && <span className="text-sm text-slate-500">Out: {new Date(attendance.checkOut).toLocaleTimeString()}</span>}
              </div>
              {!attendance.checkOut && (
                <button onClick={doCheckOut} disabled={checkinLoading} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
                  {checkinLoading ? 'Processing...' : 'Check Out Now'}
                </button>
              )}
              {attendance.checkOut && (
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                  <CheckCircle size={16} />
                  <span>Shift complete for today</span>
                </div>
              )}
            </div>
          ) : (
            <button onClick={doCheckIn} disabled={checkinLoading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm shadow-indigo-500/20 disabled:opacity-60 transition">
              {checkinLoading ? 'Processing...' : '✅ Check In for Today'}
            </button>
          )}
        </div>
      </div>

      {/* My Pending Tasks */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
          <ClipboardList size={18} className="text-amber-500" />
          <span>My Pending Tasks</span>
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No pending tasks. Great work!</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t: any) => (
              <div key={t.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.category} · Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No deadline'}</p>
                  {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                </div>
                <Badge label={t.priority} variant={pColors[t.priority]} />
              </div>
            ))}
          </div>
        )}
        <a href="/staff/tasks" className="mt-4 block text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          View All My Tasks →
        </a>
      </div>
    </div>
  );
}
