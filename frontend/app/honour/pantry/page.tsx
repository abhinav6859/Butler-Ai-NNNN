'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus, Sparkles } from 'lucide-react';

const CATEGORIES = ['GRAINS','VEGETABLES','FRUITS','DAIRY','OILS','SPICES','PROTEINS','BEVERAGES','OTHER'];

export default function HonourPantryPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const fetchData = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/pantry?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(1, search); }, [search]);

  const loadSuggestions = async () => {
    try {
      const res = await api.get('/ai/suggest-meals');
      setSuggestions(res.data);
    } catch { setSuggestions([]); }
  };

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({ name: row.name, quantity: row.quantity, unit: row.unit, minStock: row.minStock, category: row.category, expiryDate: row.expiryDate?.split('T')[0] });
    setError(''); setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      if (editingItem) { await api.put(`/pantry/${editingItem.id}`, fd); }
      else { await api.post('/pantry', fd); }
      setModalOpen(false); fetchData(pagination.page, search);
    } catch (e: any) { setError(e?.response?.data?.error || 'Error saving item'); }
    finally { setSaving(false); }
  };

  const onDelete = async (row: any) => {
    try { await api.delete(`/pantry/${row.id}`); fetchData(pagination.page, search); } catch {}
  };

  const columns = [
    { key: 'name', label: 'Item Name', render: (r: any) => <span className="font-semibold text-slate-700 dark:text-slate-200">{r.name}</span> },
    { key: 'category', label: 'Category', render: (r: any) => <Badge label={r.category} /> },
    { key: 'quantity', label: 'Stock', render: (r: any) => (
      <span className={r.quantity < r.minStock ? 'text-rose-500 font-bold' : 'text-emerald-600 font-semibold'}>
        {r.quantity} {r.unit}
      </span>
    )},
    { key: 'minStock', label: 'Min Stock', render: (r: any) => `${r.minStock} ${r.unit}` },
    { key: 'expiryDate', label: 'Expiry', render: (r: any) => r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.quantity < r.minStock ? 'LOW STOCK' : 'OK'} variant={r.quantity < r.minStock ? 'danger' : 'success'} /> },
  ];

  return (
    <div>
      <PageHeader title="Pantry Management" description="Track all pantry items and stock levels"
        action={
          <div className="flex space-x-2">
            <button onClick={loadSuggestions} className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
              <Sparkles size={16} /><span>AI Meal Suggestions</span>
            </button>
            <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
              <Plus size={16} /><span>Add Item</span>
            </button>
          </div>
        }
      />

      {suggestions.length > 0 && (
        <div className="mb-6 p-5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-2xl">
          <h3 className="font-bold text-purple-700 dark:text-purple-300 mb-3 flex items-center space-x-2"><Sparkles size={16} /><span>AI Meal Suggestions Based on Pantry</span></h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {suggestions.slice(0, 6).map((s: any) => (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{s.name}</p>
                <p className="text-xs text-slate-400 mt-1">{s.matchedIngredients}/{s.totalIngredients} ingredients · {s.prepTime} min</p>
                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${s.matchPercentage}%` }} />
                </div>
                <p className="text-xs text-right text-slate-400 mt-1">{s.matchPercentage}% match</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} onDelete={onDelete} searchPlaceholder="Search pantry items..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Pantry Item' : 'Add Pantry Item'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Item Name" required error={errors.name?.message as string}>
            <input {...register('name', { required: 'Name is required' })} className={inputClass} placeholder="e.g. Basmati Rice" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity" required error={errors.quantity?.message as string}>
              <input type="number" step="0.01" {...register('quantity', { required: 'Quantity is required' })} className={inputClass} placeholder="e.g. 5" />
            </FormField>
            <FormField label="Unit" required error={errors.unit?.message as string}>
              <input {...register('unit', { required: 'Unit is required' })} className={inputClass} placeholder="kg / g / l / pcs" />
            </FormField>
          </div>
          <FormField label="Minimum Stock Level">
            <input type="number" step="0.01" {...register('minStock')} className={inputClass} placeholder="e.g. 2" />
          </FormField>
          <FormField label="Category">
            <select {...register('category')} className={selectClass}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Expiry Date">
            <input type="date" {...register('expiryDate')} className={inputClass} />
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
