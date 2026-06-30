'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus } from 'lucide-react';

export default function AdminHomesPage() {
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
      const res = await api.get(`/homes?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData(1, search);
    api.get('/users?role=HONOUR&limit=50').then(r => setHonourUsers(r.data.data || [])).catch(() => {});
  }, [search]);

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({ name: row.name, address: row.address, honourId: row.honourId });
    setError(''); setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      if (editingItem) { await api.put(`/homes/${editingItem.id}`, fd); }
      else { await api.post('/homes', fd); }
      setModalOpen(false);
      fetchData(pagination.page, search);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const onDelete = async (row: any) => {
    try { await api.delete(`/homes/${row.id}`); fetchData(pagination.page, search); }
    catch (e) { console.error(e); }
  };

  const columns = [
    { key: 'name', label: 'Home Name' },
    { key: 'address', label: 'Address', render: (r: any) => r.address || '—' },
    { key: 'honour', label: 'Owner', render: (r: any) => r.honour?.name || '—' },
    { key: 'createdAt', label: 'Created', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        title="Homes Management"
        description="Manage registered household properties"
        action={
          <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
            <Plus size={16} /><span>Add Home</span>
          </button>
        }
      />
      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} onDelete={onDelete} searchPlaceholder="Search homes..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Home' : 'Register New Home'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Home Name" required error={errors.name?.message as string}>
            <input {...register('name', { required: 'Name is required' })} className={inputClass} placeholder="e.g. Mansion Grandeur" />
          </FormField>
          <FormField label="Address">
            <input {...register('address')} className={inputClass} placeholder="e.g. 77 Ocean Drive, Mumbai" />
          </FormField>
          <FormField label="Assigned Honour (Owner)" required error={errors.honourId?.message as string}>
            <select {...register('honourId', { required: 'Owner is required' })} className={inputClass}>
              <option value="">Select owner...</option>
              {honourUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
