'use client';

import { useState } from 'react';
import { Clock, CheckCircle, LogIn, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui';
import api from '@/services/api';

interface AttendanceCardProps {
  attendance: any;
  onUpdate: (record: any) => void;
  accentColor?: string;
}

export default function AttendanceCard({ attendance, onUpdate, accentColor = 'indigo' }: AttendanceCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const doCheckIn = async () => {
    setLoading(true);
    try {
      const res = await api.post('/attendance/check-in');
      onUpdate(res.data);
      setMessage('✅ Checked in successfully!');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const doCheckOut = async () => {
    setLoading(true);
    try {
      const res = await api.post('/attendance/check-out');
      onUpdate(res.data);
      setMessage('✅ Checked out successfully!');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const accentClasses: Record<string, { bg: string; text: string; banner: string; btn: string; btnHover: string }> = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-500',
      banner: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20',
      btn: 'bg-indigo-600',
      btnHover: 'hover:bg-indigo-700',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-500',
      banner: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20',
      btn: 'bg-emerald-600',
      btnHover: 'hover:bg-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-500',
      banner: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20',
      btn: 'bg-amber-600',
      btnHover: 'hover:bg-amber-700',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-500',
      banner: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20',
      btn: 'bg-blue-600',
      btnHover: 'hover:bg-blue-700',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      text: 'text-rose-500',
      banner: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20',
      btn: 'bg-rose-600',
      btnHover: 'hover:bg-rose-700',
    },
  };

  const ac = accentClasses[accentColor] || accentClasses.indigo;

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6">
      <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
        <Clock size={18} className={ac.text} />
        <span>Today&apos;s Attendance</span>
      </h2>

      {message && (
        <div className={`mb-4 text-sm px-4 py-3 rounded-xl flex items-center justify-between ${ac.banner}`}>
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs font-bold underline ml-3">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center space-x-4">
        {attendance ? (
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Badge
                label={attendance.status}
                variant={attendance.status === 'PRESENT' ? 'success' : attendance.status === 'LATE' ? 'warning' : 'danger'}
              />
              {attendance.checkIn && (
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                  <LogIn size={14} />
                  <span>{new Date(attendance.checkIn).toLocaleTimeString()}</span>
                </span>
              )}
              {attendance.checkOut && (
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                  <LogOut size={14} />
                  <span>{new Date(attendance.checkOut).toLocaleTimeString()}</span>
                </span>
              )}
            </div>
            {!attendance.checkOut ? (
              <button
                onClick={doCheckOut}
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-all duration-200 shadow-sm shadow-rose-500/20"
              >
                {loading ? 'Processing...' : '🔴 Check Out Now'}
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                <CheckCircle size={16} />
                <span>Shift complete for today</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={doCheckIn}
            disabled={loading}
            className={`px-6 py-3 ${ac.btn} ${ac.btnHover} text-white font-semibold rounded-xl shadow-lg disabled:opacity-60 transition-all duration-200`}
          >
            {loading ? 'Processing...' : '🟢 Check In for Today'}
          </button>
        )}
      </div>
    </div>
  );
}
