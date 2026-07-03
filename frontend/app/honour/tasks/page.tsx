'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, Badge } from '@/components/ui';
import { DataTable } from '@/components/ui/DataTable';
import { Modal, FormField, inputClass, selectClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const CATEGORIES = ['CLEANING','COOKING','MAINTENANCE','DRIVING','SECURITY','SHOPPING','OTHER'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const STATUSES = ['PENDING','IN_PROGRESS','COMPLETED','CANCELLED'];

export default function HonourTasksPage() {
  // ---------- STATE ----------
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [aiText, setAiText] = useState('');
  const [aiParsed, setAiParsed] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for speech
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>();

  // ---------- DATA FETCHING WITH TIMEOUT ----------
  const fetchData = useCallback(async (page = 1, q = '') => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Loading tasks timed out. Please refresh.');
    }, 8000);

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/tasks?page=${page}&search=${q}`, { signal: abortController.signal });
      setData(res.data.data);
      setPagination(res.data.pagination);
      clearTimeout(timeoutId);
    } catch (e: any) {
      if (e.name === 'AbortError' || e.code === 'ERR_CANCELED') return;
      console.error('Tasks fetch error:', e);
      setError('Failed to load tasks. Please try again.');
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1, search);
    const abortCtrl = new AbortController();
    api.get('/staff?limit=50', { signal: abortCtrl.signal })
      .then(r => setStaff(r.data.data || []))
      .catch(() => {});
    return () => abortCtrl.abort();
  }, [search, fetchData]);

  // ---------- SPEECH RECOGNITION (AI textarea) ----------
  useEffect(() => {
    const isSpeechSupported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    if (!isSpeechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setAiText(transcript.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ---------- VOICE INPUT TOGGLE ----------
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setIsRecording(false);
      }
    }
  };

  // ---------- TEXT‑TO‑SPEECH (for parsed AI result) ----------
  const speakParsed = () => {
    if (!window.speechSynthesis) {
      alert('Text‑to‑speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!aiParsed) return;

    // Build a readable summary
    const lines = [
      `Title: ${aiParsed.title || 'Not set'}`,
      `Category: ${aiParsed.category || 'Not set'}`,
      `Priority: ${aiParsed.priority || 'Not set'}`,
      aiParsed.assignedStaffId ? `Assigned staff ID: ${aiParsed.assignedStaffId}` : 'Unassigned',
      aiParsed.dueDate ? `Due date: ${new Date(aiParsed.dueDate).toLocaleDateString()}` : 'No due date',
    ].filter(Boolean).join('. ');

    const utterance = new SpeechSynthesisUtterance(lines);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking when parsed result changes
  useEffect(() => {
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [aiParsed]);

  // ---------- CRUD OPERATIONS ----------
  const openCreate = () => { setEditingItem(null); reset({}); setFormError(''); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditingItem(row);
    reset({
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      category: row.category,
      assignedStaffId: row.assignedStaffId,
      dueDate: row.dueDate?.split('T')[0],
      remarks: row.remarks,
    });
    setFormError('');
    setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true);
    setFormError('');
    try {
      if (editingItem) {
        await api.put(`/tasks/${editingItem.id}`, fd);
      } else {
        await api.post('/tasks', fd);
      }
      setModalOpen(false);
      fetchData(pagination.page, search);
    } catch (e: any) {
      setFormError(e?.response?.data?.error || 'Error saving task');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: any) => {
    try {
      await api.delete(`/tasks/${row.id}`);
      fetchData(pagination.page, search);
    } catch (e) { console.error(e); }
  };

  // ---------- AI PARSE ----------
  const parseWithAI = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/parse-task', { text: aiText });
      setAiParsed(res.data);
    } catch {
      setAiParsed(null);
    } finally {
      setAiLoading(false);
    }
  };

  const useAIParsed = () => {
    if (!aiParsed) return;
    reset(aiParsed);
    if (aiParsed.dueDate) {
      setValue('dueDate', new Date(aiParsed.dueDate).toISOString().split('T')[0]);
    }
    setAiModalOpen(false);
    setAiText('');
    setAiParsed(null);
    setFormError('');
    setModalOpen(true);
  };

  // ---------- RENDER HELPERS ----------
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

  // ---------- ERROR / LOADING STATES ----------
  if (loading && data.length === 0) {
    return <LoadingSpinner />; // we need to import LoadingSpinner
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 text-lg font-semibold">⚠️ {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Task Management"
        description="Create, assign and track household tasks"
        action={
          <div className="flex space-x-2">
            <button
              onClick={() => setAiModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <Sparkles size={16} /><span>AI Task</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <Plus size={16} /><span>New Task</span>
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchData(p, search)}
        onSearch={setSearch}
        onEdit={openEdit}
        onDelete={onDelete}
        searchPlaceholder="Search tasks..."
      />

      {/* ---------- AI PARSE MODAL (with voice) ---------- */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Create Task with AI">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Describe the task in English or Hindi. Butler AI will parse it into a structured task for you.
            <br />
            <span className="text-indigo-500">🎤 Click the mic to speak</span> · <span className="text-indigo-500">🔊 Click the speaker to hear the parsed result</span>
          </p>

          <div className="flex space-x-2">
            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              rows={3}
              className={inputClass + ' flex-1'}
              placeholder="e.g. suresh bhaiya ko kal subah 8 baje gaadi clean karni hai, urgent hai"
            />
            {recognitionRef.current && (
              <button
                onClick={toggleRecording}
                className={`px-3 py-2 rounded-xl transition self-start ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}
          </div>

          {isRecording && (
            <p className="text-xs text-red-500 animate-pulse flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Listening... speak your task description
            </p>
          )}

          <button
            onClick={parseWithAI}
            disabled={aiLoading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition"
          >
            {aiLoading ? 'Parsing...' : 'Parse with AI'}
          </button>

          {aiParsed && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2 text-sm relative">
              <div className="flex justify-between items-start">
                <div>
                  <p><strong>Title:</strong> {aiParsed.title}</p>
                  <p><strong>Category:</strong> {aiParsed.category}</p>
                  <p><strong>Priority:</strong> {aiParsed.priority}</p>
                  {aiParsed.assignedStaffId && <p><strong>Assigned Staff ID:</strong> {aiParsed.assignedStaffId}</p>}
                  {aiParsed.dueDate && <p><strong>Due Date:</strong> {new Date(aiParsed.dueDate).toLocaleDateString()}</p>}
                </div>
                {window.speechSynthesis && (
                  <button
                    onClick={speakParsed}
                    className="p-1.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition text-indigo-600 dark:text-indigo-300"
                    aria-label={isSpeaking ? 'Stop speaking' : 'Read parsed task aloud'}
                  >
                    {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
              </div>
              <button
                onClick={useAIParsed}
                className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
              >
                Use This → Open Form
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* ---------- TASK CREATE/EDIT MODAL ---------- */}
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
          {formError && <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">{formError}</p>}
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

// Helper spinner component (if not imported from @/components/ui)
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
}