'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus } from 'lucide-react';

const STAFF_TYPES = ['BUTLER','CHEF','MAID','DRIVER','SECURITY','GARDENER','HOUSEKEEPER','NANNY','OTHER'];
const STATUS_OPTS = ['ACTIVE', 'ON_LEAVE', 'INACTIVE'];

export default function AdminStaffPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [honourUsers, setHonourUsers] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const fetchData = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/staff?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(1, search); }, [search]);

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({ name: row.name, phone: row.phone, staffType: row.staffType, salary: row.salary, status: row.status });
    setError('');
    setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      if (editingItem) {
        await api.put(`/staff/${editingItem.id}`, fd);
      } else {
        await api.post('/staff', fd);
      }
      setModalOpen(false);
      fetchData(pagination.page, search);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const onDelete = async (row: any) => {
    try { await api.delete(`/staff/${row.id}`); fetchData(pagination.page, search); }
    catch (e) { console.error(e); }
  };

  const statusColor: Record<string, any> = { ACTIVE: 'success', ON_LEAVE: 'warning', INACTIVE: 'danger' };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'staffType', label: 'Type', render: (r: any) => <Badge label={r.staffType} variant="indigo" /> },
    { key: 'phone', label: 'Phone', render: (r: any) => r.phone || '—' },
    { key: 'salary', label: 'Salary', render: (r: any) => r.salary ? `₹${r.salary.toLocaleString()}` : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.status} variant={statusColor[r.status] || 'default'} /> },
    { key: 'joinedDate', label: 'Joined', render: (r: any) => new Date(r.joinedDate).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        title="Staff Management"
        description="Manage all household staff members"
        action={
          <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
            <Plus size={16} /><span>Add Staff</span>
          </button>
        }
      />
      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} onDelete={onDelete} searchPlaceholder="Search staff..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Staff Member' : 'Add New Staff Member'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Full Name" required error={errors.name?.message as string}>
            <input {...register('name', { required: 'Name is required' })} className={inputClass} placeholder="e.g. Ramesh Kumar" />
          </FormField>
          <FormField label="Staff Type" required error={errors.staffType?.message as string}>
            <select {...register('staffType', { required: 'Type is required' })} className={selectClass}>
              <option value="">Select type...</option>
              {STAFF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Phone Number">
            <input {...register('phone')} className={inputClass} placeholder="+91 9XXXXXXXXX" />
          </FormField>
          <FormField label="Monthly Salary (₹)">
            <input type="number" {...register('salary')} className={inputClass} placeholder="e.g. 25000" />
          </FormField>
          <FormField label="Status">
            <select {...register('status')} className={selectClass}>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
