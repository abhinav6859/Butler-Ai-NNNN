'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus } from 'lucide-react';

export default function HonourVisitorsPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const fetchData = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/visitors?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(1, search); }, [search]);

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({ name: row.name, phone: row.phone, purpose: row.purpose, status: row.status });
    setError(''); setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      if (editingItem) { await api.put(`/visitors/${editingItem.id}`, fd); }
      else { await api.post('/visitors', fd); }
      setModalOpen(false); fetchData(pagination.page, search);
    } catch (e: any) { setError(e?.response?.data?.error || 'Error saving visitor'); }
    finally { setSaving(false); }
  };

  const onDelete = async (row: any) => {
    try { await api.delete(`/visitors/${row.id}`); fetchData(pagination.page, search); } catch {}
  };

  const sColors: Record<string, any> = { EXPECTED: 'indigo', CHECKED_IN: 'success', CHECKED_OUT: 'default' };

  const columns = [
    { key: 'name', label: 'Visitor Name', render: (r: any) => <span className="font-semibold">{r.name}</span> },
    { key: 'phone', label: 'Phone', render: (r: any) => r.phone || '—' },
    { key: 'purpose', label: 'Purpose', render: (r: any) => r.purpose || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.status.replace('_', ' ')} variant={sColors[r.status]} /> },
    { key: 'checkIn', label: 'Check In', render: (r: any) => r.checkIn ? new Date(r.checkIn).toLocaleString() : '—' },
    { key: 'checkOut', label: 'Check Out', render: (r: any) => r.checkOut ? new Date(r.checkOut).toLocaleString() : '—' },
  ];

  return (
    <div>
      <PageHeader title="Visitor Log" description="Track all guests and visitors to the household"
        action={
          <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
            <Plus size={16} /><span>Log Visitor</span>
          </button>
        }
      />
      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} onDelete={onDelete} searchPlaceholder="Search visitors..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Update Visitor' : 'Log New Visitor'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Visitor Name" required error={errors.name?.message as string}>
            <input {...register('name', { required: 'Name is required' })} className={inputClass} placeholder="e.g. Mr. Sharma" />
          </FormField>
          <FormField label="Phone Number">
            <input {...register('phone')} className={inputClass} placeholder="+91 9XXXXXXXXX" />
          </FormField>
          <FormField label="Purpose of Visit">
            <input {...register('purpose')} className={inputClass} placeholder="e.g. Meeting, Delivery, Social Visit" />
          </FormField>
          <FormField label="Status">
            <select {...register('status')} className={selectClass}>
              <option value="EXPECTED">EXPECTED</option>
              <option value="CHECKED_IN">CHECKED IN</option>
              <option value="CHECKED_OUT">CHECKED OUT</option>
            </select>
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Log Visitor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
