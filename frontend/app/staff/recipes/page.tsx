'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus, Clock, BookOpen } from 'lucide-react';

export default function StaffRecipesPage() {
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
    try { const res = await api.get(`/recipes?page=${page}&search=${q}`); setData(res.data.data); setPagination(res.data.pagination); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(1, search); }, [search]);

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({ name: row.name, instructions: row.instructions, prepTime: row.prepTime, ingredientsText: Array.isArray(row.ingredients) ? row.ingredients.map((i: any) => `${i.name}: ${i.quantity} ${i.unit}`).join('\n') : '' });
    setError(''); setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      const ingredients = (fd.ingredientsText || '').split('\n').filter((l: string) => l.trim()).map((l: string) => {
        const [name, rest] = l.split(':').map((s: string) => s.trim());
        const parts = (rest || '').split(' ');
        return { name: name || l, quantity: parseFloat(parts[0]) || 1, unit: parts.slice(1).join(' ') || 'pcs' };
      });
      const payload = { name: fd.name, instructions: fd.instructions, prepTime: fd.prepTime, ingredients };
      if (editingItem) { await api.put(`/recipes/${editingItem.id}`, payload); }
      else { await api.post('/recipes', payload); }
      setModalOpen(false); fetchData(pagination.page, search);
    } catch (e: any) { setError(e?.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const onDelete = async (row: any) => { try { await api.delete(`/recipes/${row.id}`); fetchData(pagination.page, search); } catch {} };

  const columns = [
    { key: 'name', label: 'Recipe Name', render: (r: any) => <span className="font-semibold">{r.name}</span> },
    { key: 'prepTime', label: 'Prep Time', render: (r: any) => <span className="flex items-center space-x-1 text-slate-500"><Clock size={13} /><span>{r.prepTime} min</span></span> },
    { key: 'ingredients', label: 'Ingredients', render: (r: any) => {
      const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
      return <span className="text-xs text-slate-500">{ings.length} items</span>;
    }},
    { key: 'createdAt', label: 'Added', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Recipe Book" description="Manage all household recipes and cooking instructions"
        action={<button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"><Plus size={16} /><span>Add Recipe</span></button>}
      />
      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} onDelete={onDelete} searchPlaceholder="Search recipes..." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Recipe' : 'Add New Recipe'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Recipe Name" required error={errors.name?.message as string}>
            <input {...register('name', { required: 'Required' })} className={inputClass} placeholder="e.g. Paneer Butter Masala" />
          </FormField>
          <FormField label="Preparation Time (minutes)">
            <input type="number" {...register('prepTime')} className={inputClass} placeholder="e.g. 30" />
          </FormField>
          <FormField label="Ingredients (one per line: Name: Quantity Unit)" required error={errors.instructions?.message as string}>
            <textarea {...register('ingredientsText')} className={inputClass} rows={4} placeholder={"Paneer: 200 g\nButter: 50 g\nTomatoes: 3 pcs"} />
          </FormField>
          <FormField label="Cooking Instructions" required error={errors.instructions?.message as string}>
            <textarea {...register('instructions', { required: 'Required' })} className={inputClass} rows={4} placeholder="Step by step cooking instructions..." />
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">{saving ? 'Saving...' : editingItem ? 'Update' : 'Add Recipe'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
