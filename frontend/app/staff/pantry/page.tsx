'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus } from 'lucide-react';

const CATEGORIES = ['GRAINS','VEGETABLES','FRUITS','DAIRY','OILS','SPICES','PROTEINS','BEVERAGES','OTHER'];

export default function StaffPantryPage() {
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
    try { const res = await api.get(`/pantry?page=${page}&search=${q}`); setData(res.data.data); setPagination(res.data.pagination); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(1, search); }, [search]);

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => { setEditingItem(row); reset({ name: row.name, quantity: row.quantity, unit: row.unit, minStock: row.minStock, category: row.category }); setError(''); setModalOpen(true); };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      if (editingItem) { await api.put(`/pantry/${editingItem.id}`, fd); }
      else { await api.post('/pantry', fd); }
      setModalOpen(false); fetchData(pagination.page, search);
    } catch (e: any) { setError(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'name', label: 'Item', render: (r: any) => <span className="font-semibold">{r.name}</span> },
    { key: 'category', label: 'Category', render: (r: any) => <Badge label={r.category} /> },
    { key: 'quantity', label: 'Stock', render: (r: any) => <span className={r.quantity < r.minStock ? 'text-rose-500 font-bold' : 'text-emerald-600 font-semibold'}>{r.quantity} {r.unit}</span> },
    { key: 'minStock', label: 'Min', render: (r: any) => `${r.minStock} ${r.unit}` },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.quantity < r.minStock ? 'LOW' : 'OK'} variant={r.quantity < r.minStock ? 'danger' : 'success'} /> },
  ];

  return (
    <div>
      <PageHeader title="Kitchen Pantry" description="Manage stock levels for all ingredients"
        action={<button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"><Plus size={16} /><span>Add Item</span></button>}
      />
      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} searchPlaceholder="Search pantry..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Update Stock' : 'Add Pantry Item'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Item Name" required error={errors.name?.message as string}><input {...register('name', { required: 'Required' })} className={inputClass} placeholder="e.g. Basmati Rice" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity" required><input type="number" step="0.01" {...register('quantity', { required: 'Required' })} className={inputClass} /></FormField>
            <FormField label="Unit" required><input {...register('unit', { required: 'Required' })} className={inputClass} placeholder="kg / g / l" /></FormField>
          </div>
          <FormField label="Min Stock"><input type="number" step="0.01" {...register('minStock')} className={inputClass} /></FormField>
          <FormField label="Category"><select {...register('category')} className={selectClass}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">{saving ? 'Saving...' : editingItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
