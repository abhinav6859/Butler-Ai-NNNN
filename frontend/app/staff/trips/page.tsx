'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader, LoadingSpinner, Badge } from '@/components/ui';
import api from '@/services/api';
import { Car, Clock, Calendar, AlertCircle, Play, CheckCircle } from 'lucide-react';

const pColors: Record<string, any> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'danger', URGENT: 'danger' };
const sColors: Record<string, any> = { PENDING: 'warning', IN_PROGRESS: 'indigo', COMPLETED: 'success', CANCELLED: 'danger' };

export default function DriverTripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchTrips = useCallback(async () => {
    if (!user?.staffId) return;
    setLoading(true);
    try {
      // Fetch driving tasks assigned to this driver
      const res = await api.get(`/tasks?assignedStaffId=${user.staffId}&category=DRIVING`);
      setTrips(res.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.put(`/tasks/${id}`, {
        status,
        remarks: status === 'COMPLETED' ? 'Trip completed by driver' : 'Trip started by driver',
      });
      setMessage(`✅ Trip marked as ${status.replace('_', ' ').toLowerCase()}!`);
      fetchTrips();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Trips & Driving Duties" description="View and update your driving assignments and schedules" />

      {message && (
        <div className="mb-6 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : trips.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-8 text-center">
          <Car size={40} className="mx-auto text-slate-300 dark:text-slate-750 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold">No driving duties assigned</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 hover:border-indigo-500/30 transition duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Car size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{trip.title}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <Badge label={trip.priority} variant={pColors[trip.priority]} />
                      <Badge label={trip.status.replace('_', ' ')} variant={sColors[trip.status]} />
                    </div>
                  </div>
                </div>

                {trip.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-350 ml-12 mb-3">{trip.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-slate-550 dark:text-slate-400 ml-12">
                  <div className="flex items-center space-x-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Due: {trip.dueDate ? new Date(trip.dueDate).toLocaleDateString('en-IN') : 'No deadline'}</span>
                  </div>
                  {trip.completionDate && (
                    <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle size={14} />
                      <span>Completed: {new Date(trip.completionDate).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 md:self-center ml-12 md:ml-0">
                {trip.status === 'PENDING' && (
                  <button
                    disabled={actionLoading === trip.id}
                    onClick={() => handleUpdateStatus(trip.id, 'IN_PROGRESS')}
                    className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-semibold rounded-xl disabled:opacity-60 transition"
                  >
                    <Play size={14} />
                    <span>Start Duty</span>
                  </button>
                )}
                {trip.status === 'IN_PROGRESS' && (
                  <button
                    disabled={actionLoading === trip.id}
                    onClick={() => handleUpdateStatus(trip.id, 'COMPLETED')}
                    className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-60 transition"
                  >
                    <CheckCircle size={14} />
                    <span>Mark Completed</span>
                  </button>
                )}
                {trip.status === 'COMPLETED' && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl">
                    Duty Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
