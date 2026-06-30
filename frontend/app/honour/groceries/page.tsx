'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus, Sparkles } from 'lucide-react';

export default function HonourGroceriesPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const fetchData = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/groceries?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(1, search); }, [search]);

  const loadAISuggestions = async () => {
    try {
      const res = await api.get('/ai/suggest-groceries');
      setAiSuggestions(res.data);
    } catch { setAiSuggestions([]); }
  };

  const addSuggestedItem = async (item: any) => {
    try {
      await api.post('/groceries', { name: item.name, quantity: item.suggestedQuantity, unit: item.unit, category: item.category });
      fetchData(1, '');
    } catch {}
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      await api.post('/groceries', fd);
      setModalOpen(false); reset({}); fetchData(pagination.page, search);
    } catch (e: any) { setError(e?.response?.data?.error || 'Error adding item'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (row: any, status: string) => {
    try { await api.put(`/groceries/${row.id}`, { status }); fetchData(pagination.page, search); } catch {}
  };

  const onDelete = async (row: any) => {
    try { await api.delete(`/groceries/${row.id}`); fetchData(pagination.page, search); } catch {}
  };

  const sColors: Record<string, any> = { PENDING: 'warning', PURCHASED: 'success', CANCELLED: 'danger' };

  const columns = [
    { key: 'name', label: 'Item', render: (r: any) => <span className="font-semibold">{r.name}</span> },
    { key: 'quantity', label: 'Qty', render: (r: any) => `${r.quantity} ${r.unit}` },
    { key: 'category', label: 'Category', render: (r: any) => r.category || '—' },
    { key: 'status', label: 'Status', render: (r: any) => (
      <div className="flex items-center space-x-2">
        <Badge label={r.status} variant={sColors[r.status]} />
        {r.status === 'PENDING' && (
          <button onClick={(e) => { e.stopPropagation(); updateStatus(r, 'PURCHASED'); }} className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 transition">Mark Bought</button>
        )}
      </div>
    )},
    { key: 'requestedBy', label: 'Requested By', render: (r: any) => r.requestedBy?.name || '—' },
    { key: 'createdAt', label: 'Date', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Grocery List" description="Manage purchase requests and track delivery"
        action={
          <div className="flex space-x-2">
            <button onClick={loadAISuggestions} className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
              <Sparkles size={16} /><span>AI Suggestions</span>
            </button>
            <button onClick={() => { reset({}); setError(''); setModalOpen(true); }} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
              <Plus size={16} /><span>Add Item</span>
            </button>
          </div>
        }
      />

      {aiSuggestions.length > 0 && (
        <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl">
          <h3 className="font-bold text-amber-700 dark:text-amber-300 mb-3">AI Grocery Suggestions (Low Stock Items)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {aiSuggestions.map((item: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{item.name}</p>
                <p className="text-xs text-slate-400">Need: {item.suggestedQuantity} {item.unit}</p>
                <p className="text-xs text-rose-500">Current: {item.currentQuantity} {item.unit}</p>
                <button onClick={() => addSuggestedItem(item)} className="mt-2 w-full text-xs py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Add to List</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onDelete={onDelete} searchPlaceholder="Search grocery items..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Grocery Item">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Item Name" required error={errors.name?.message as string}>
            <input {...register('name', { required: 'Name is required' })} className={inputClass} placeholder="e.g. Tomatoes" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity" required error={errors.quantity?.message as string}>
              <input type="number" step="0.01" {...register('quantity', { required: 'Quantity is required' })} className={inputClass} placeholder="5" />
            </FormField>
            <FormField label="Unit" required error={errors.unit?.message as string}>
              <input {...register('unit', { required: 'Unit is required' })} className={inputClass} placeholder="kg / pcs / l" />
            </FormField>
          </div>
          <FormField label="Category">
            <input {...register('category')} className={inputClass} placeholder="e.g. VEGETABLES" />
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Adding...' : 'Add to List'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
