'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, LoadingSpinner, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus } from 'lucide-react';

export default function AdminUsersPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const fetchUsers = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/users?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1, search); }, [search]);

  const openCreate = () => { setEditingUser(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => { setEditingUser(row); reset({ name: row.name, email: row.email, role: row.role }); setError(''); setModalOpen(true); };

  const onSubmit = async (formData: any) => {
    setSaving(true);
    setError('');
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setModalOpen(false);
      fetchUsers(pagination.page, search);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: any) => {
    try {
      await api.delete(`/users/${row.id}`);
      fetchUsers(pagination.page, search);
    } catch (e) { console.error(e); }
  };

  const roleVariants: Record<string, any> = { ADMIN: 'danger', HONOUR: 'indigo', STAFF: 'success' };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r: any) => <Badge label={r.role} variant={roleVariants[r.role]} /> },
    { key: 'staffType', label: 'Staff Type', render: (r: any) => r.staff?.staffType ? <Badge label={r.staff.staffType} /> : <span className="text-slate-400">—</span> },
    { key: 'createdAt', label: 'Joined', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create and manage all platform users and their roles"
        action={
          <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition">
            <Plus size={16} /> <span>Add User</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchUsers(p, search)}
        onSearch={setSearch}
        onEdit={openEdit}
        onDelete={onDelete}
        searchPlaceholder="Search users..."
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Full Name" error={errors.name?.message as string} required>
            <input {...register('name', { required: 'Name is required' })} className={inputClass} placeholder="e.g. John Doe" />
          </FormField>
          <FormField label="Email" error={errors.email?.message as string} required>
            <input type="email" {...register('email', { required: 'Email is required' })} className={inputClass} placeholder="user@butler.ai" />
          </FormField>
          {!editingUser && (
            <FormField label="Password" error={errors.password?.message as string} required>
              <input type="password" {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} className={inputClass} placeholder="••••••••" />
            </FormField>
          )}
          <FormField label="Role" error={errors.role?.message as string} required>
            <select {...register('role', { required: 'Role is required' })} className={selectClass}>
              <option value="">Select role...</option>
              <option value="ADMIN">ADMIN</option>
              <option value="HONOUR">HONOUR</option>
              <option value="STAFF">STAFF</option>
            </select>
          </FormField>
          <FormField label="Staff Type (if STAFF)">
            <select {...register('staffType')} className={selectClass}>
              <option value="">N/A</option>
              {['BUTLER','CHEF','MAID','DRIVER','SECURITY','GARDENER','HOUSEKEEPER','NANNY','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
