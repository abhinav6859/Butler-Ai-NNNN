'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, LoadingSpinner, Badge } from '@/components/ui';
import { Modal, FormField, inputClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { UserCheck, UserMinus, Plus, ShieldAlert, Phone, FileText } from 'lucide-react';

export default function SecurityVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EXPECTED' | 'CHECKED_IN' | 'CHECKED_OUT'>('EXPECTED');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const { register, handleSubmit, reset } = useForm<any>();

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/visitors?limit=100&status=${activeTab}`);
      setVisitors(res.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleCheckIn = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/visitors/${id}`, { status: 'CHECKED_IN' });
      setMessage('✅ Visitor checked in. Host notified via WhatsApp!');
      fetchVisitors();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/visitors/${id}`, { status: 'CHECKED_OUT' });
      setMessage('✅ Visitor checked out successfully.');
      fetchVisitors();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const onSubmit = async (fd: any) => {
    setSaving(true);
    try {
      await api.post('/visitors', {
        ...fd,
        status: fd.status || 'CHECKED_IN',
      });
      setModalOpen(false);
      reset();
      fetchVisitors();
      setMessage('✅ Visitor registered and checked in successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Visitor Gate Control" description="Manage household visitors, check-ins, and security logs" />

      {message && (
        <div className="mb-6 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Control Actions & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-905 p-1 rounded-xl">
          {(['EXPECTED', 'CHECKED_IN', 'CHECKED_OUT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-150 ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'EXPECTED' ? 'Expected' : tab === 'CHECKED_IN' ? 'Checked In' : 'Checked Out'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-indigo-600/10"
        >
          <Plus size={18} />
          <span>Register Walk-in Guest</span>
        </button>
      </div>

      {/* Visitor List */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : visitors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-8 text-center">
          <ShieldAlert size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold">No visitors found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitors.map((v) => (
            <div
              key={v.id}
              className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 hover:border-indigo-500/30 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{v.name}</h3>
                  <Badge
                    label={v.status}
                    variant={v.status === 'CHECKED_IN' ? 'success' : v.status === 'EXPECTED' ? 'warning' : 'default'}
                  />
                </div>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {v.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{v.phone}</span>
                    </div>
                  )}
                  {v.purpose && (
                    <div className="flex items-center space-x-2">
                      <FileText size={14} className="text-slate-400" />
                      <span>Purpose: {v.purpose}</span>
                    </div>
                  )}
                  {v.checkIn && (
                    <div>
                      <span className="font-semibold text-slate-400">In:</span> {new Date(v.checkIn).toLocaleString()}
                    </div>
                  )}
                  {v.checkOut && (
                    <div>
                      <span className="font-semibold text-slate-400">Out:</span> {new Date(v.checkOut).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
                {v.status === 'EXPECTED' && (
                  <button
                    disabled={actionLoading === v.id}
                    onClick={() => handleCheckIn(v.id)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-60 transition"
                  >
                    <UserCheck size={14} />
                    <span>{actionLoading === v.id ? 'Checking In...' : 'Check In'}</span>
                  </button>
                )}
                {v.status === 'CHECKED_IN' && (
                  <button
                    disabled={actionLoading === v.id}
                    onClick={() => handleCheckOut(v.id)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white text-xs font-semibold rounded-xl disabled:opacity-60 transition"
                  >
                    <UserMinus size={14} />
                    <span>{actionLoading === v.id ? 'Checking Out...' : 'Check Out'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Walk-in Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Gate Entry">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Visitor Name">
            <input {...register('name', { required: true })} className={inputClass} placeholder="e.g. John Doe" />
          </FormField>
          <FormField label="Phone Number">
            <input {...register('phone')} className={inputClass} placeholder="e.g. +91 9876543210" />
          </FormField>
          <FormField label="Purpose of Visit">
            <input {...register('purpose')} className={inputClass} placeholder="e.g. Delivery, Maintenance, Guest" />
          </FormField>
          <FormField label="Entry Status">
            <select {...register('status')} className={inputClass}>
              <option value="CHECKED_IN">Check In Immediately (Walk-in)</option>
              <option value="EXPECTED">Expected Later</option>
            </select>
          </FormField>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition"
            >
              {saving ? 'Saving...' : 'Register Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
