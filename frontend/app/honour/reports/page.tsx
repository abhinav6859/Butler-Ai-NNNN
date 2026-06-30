'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import api from '@/services/api';
import { FileText, Plus, Trash2 } from 'lucide-react';

export default function HonourReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try { const res = await api.get('/reports?limit=20'); setReports(res.data.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const generateReport = async (type: string) => {
    setGenerating(true);
    try { await api.post('/reports', { type, title: `${type.replace(/_/g,' ')} — ${new Date().toLocaleDateString()}` }); fetchReports(); }
    catch {} finally { setGenerating(false); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    try { await api.delete(`/reports/${id}`); fetchReports(); } catch {}
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Reports" description="Generate and view household operational reports"
        action={
          <div className="flex space-x-2">
            <button onClick={() => generateReport('DAILY_SUMMARY')} disabled={generating} className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60">
              <Plus size={16} /><span>Daily Report</span>
            </button>
            <button onClick={() => generateReport('WEEKLY_SUMMARY')} disabled={generating} className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60">
              <Plus size={16} /><span>Weekly Report</span>
            </button>
          </div>
        }
      />

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>No reports generated yet.</p>
          </div>
        ) : reports.map((r: any) => (
          <div key={r.id} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><FileText size={18} /></div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{r.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>
                  {r.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{r.description}</p>}
                  {r.content && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(r.content).filter(([k]) => k !== 'timestamp').map(([k, v]: any) => (
                        <div key={k} className="text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2">
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{v}</p>
                          <p className="text-xs text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => deleteReport(r.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
