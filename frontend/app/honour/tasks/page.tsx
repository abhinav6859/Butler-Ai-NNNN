'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus, Sparkles } from 'lucide-react';

const CATEGORIES = ['CLEANING','COOKING','MAINTENANCE','DRIVING','SECURITY','SHOPPING','OTHER'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const STATUSES = ['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'];

export default function HonourTasksPage() {
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiParsed, setAiParsed] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>();

  const fetchData = useCallback(async (page = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?page=${page}&search=${q}`);
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData(1, search);
    api.get('/staff?limit=50').then(r => setStaff(r.data.data || [])).catch(() => {});
  }, [search]);

  const openCreate = () => { setEditingItem(null); reset({}); setError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({ title: row.title, description: row.description, priority: row.priority, status: row.status, category: row.category, assignedStaffId: row.assignedStaffId, dueDate: row.dueDate?.split('T')[0], remarks: row.remarks });
    setError(''); setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true); setError('');
    try {
      if (editingItem) { await api.put(`/tasks/${editingItem.id}`, fd); }
      else { await api.post('/tasks', fd); }
      setModalOpen(false); fetchData(pagination.page, search);
    } catch (e: any) { setError(e?.response?.data?.error || 'Error saving task'); }
    finally { setSaving(false); }
  };

  const onDelete = async (row: any) => {
    try { await api.delete(`/tasks/${row.id}`); fetchData(pagination.page, search); } catch (e) {}
  };

  const parseWithAI = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/parse-task', { text: aiText });
      setAiParsed(res.data);
    } catch { setAiParsed(null); }
    finally { setAiLoading(false); }
  };

  const useAIParsed = () => {
    if (!aiParsed) return;
    reset(aiParsed);
    if (aiParsed.dueDate) setValue('dueDate', new Date(aiParsed.dueDate).toISOString().split('T')[0]);
    setAiModalOpen(false); setAiText(''); setAiParsed(null);
    setError(''); setModalOpen(true);
  };

  const pColors: Record<string, any> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'danger', URGENT: 'danger' };
  const sColors: Record<string, any> = { PENDING: 'warning', IN_PROGRESS: 'indigo', COMPLETED: 'success', CANCELLED: 'danger' };

  const columns = [
    { key: 'title', label: 'Task Title', render: (r: any) => <span className="font-semibold text-slate-700 dark:text-slate-200">{r.title}</span> },
    { key: 'category', label: 'Category', render: (r: any) => <Badge label={r.category} /> },
    { key: 'priority', label: 'Priority', render: (r: any) => <Badge label={r.priority} variant={pColors[r.priority]} /> },
    { key: 'status', label: 'Status', render: (r: any) => <Badge label={r.status.replace('_',' ')} variant={sColors[r.status]} /> },
    { key: 'assignedStaff', label: 'Assigned To', render: (r: any) => r.assignedStaff?.name || <span className="text-slate-400">Unassigned</span> },
    { key: 'dueDate', label: 'Due Date', render: (r: any) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' },
  ];

  return (
    <div>
      <PageHeader title="Task Management" description="Create, assign and track household tasks"
        action={
          <div className="flex space-x-2">
            <button onClick={() => setAiModalOpen(true)} className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
              <Sparkles size={16} /><span>AI Task</span>
            </button>
            <button onClick={openCreate} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
              <Plus size={16} /><span>New Task</span>
            </button>
          </div>
        }
      />

      <DataTable columns={columns} data={data} loading={loading} total={pagination.total} page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchData(p, search)} onSearch={setSearch} onEdit={openEdit} onDelete={onDelete} searchPlaceholder="Search tasks..." />

      {/* AI Parse Modal */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Create Task with AI">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Describe the task in English or Hindi. Butler AI will parse it into a structured task for you.</p>
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="e.g. Ramesh bhaiya ko kal subah 8 baje gaadi clean karni hai, urgent hai"
          />
          <button onClick={parseWithAI} disabled={aiLoading} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
            {aiLoading ? 'Parsing...' : 'Parse with AI'}
          </button>
          {aiParsed && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 text-sm">
              <p><strong>Title:</strong> {aiParsed.title}</p>
              <p><strong>Category:</strong> {aiParsed.category}</p>
              <p><strong>Priority:</strong> {aiParsed.priority}</p>
              {aiParsed.assignedStaffId && <p><strong>Assigned Staff ID:</strong> {aiParsed.assignedStaffId}</p>}
              <button onClick={useAIParsed} className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
                Use This → Open Form
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Task Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Task' : 'Create New Task'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Task Title" required error={errors.title?.message as string}>
            <input {...register('title', { required: 'Title is required' })} className={inputClass} placeholder="e.g. Clean swimming pool" />
          </FormField>
          <FormField label="Description">
            <textarea {...register('description')} className={inputClass} rows={3} placeholder="Additional details..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" required error={errors.category?.message as string}>
              <select {...register('category', { required: 'Category is required' })} className={selectClass}>
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select {...register('priority')} className={selectClass}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assign Staff">
              <select {...register('assignedStaffId')} className={selectClass}>
                <option value="">Unassigned</option>
                {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.staffType})</option>)}
              </select>
            </FormField>
            <FormField label="Due Date">
              <input type="date" {...register('dueDate')} className={inputClass} />
            </FormField>
          </div>
          {editingItem && (
            <FormField label="Status">
              <select {...register('status')} className={selectClass}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Remarks">
            <input {...register('remarks')} className={inputClass} placeholder="Optional notes..." />
          </FormField>
          {error && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingItem ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
