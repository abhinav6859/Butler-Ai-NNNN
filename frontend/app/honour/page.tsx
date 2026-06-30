'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StatCard, PageHeader, Badge, LoadingSpinner } from '@/components/ui';
import api from '@/services/api';
import {
  ClipboardList, UserCheck, CookingPot, ShoppingBag,
  KeyRound, Sparkles, Send, MessageSquare
} from 'lucide-react';

export default function HonourDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMsg, setChatMsg] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/tasks?status=PENDING&limit=5'),
      api.get('/tasks?limit=1'),
      api.get('/pantry?limit=1'),
      api.get('/visitors?limit=1'),
    ])
      .then(([pending, allTasks, pantry, visitors]) => {
        setPendingTasks(pending.data.data || []);
        setStats({
          pendingTasks: allTasks.data.pagination?.total || 0,
          pantryItems: pantry.data.pagination?.total || 0,
          visitors: visitors.data.pagination?.total || 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const askButler = async () => {
    if (!chatMsg.trim()) return;
    setChatLoading(true);
    setChatReply('');
    try {
      const res = await api.post('/ai/chat', { message: chatMsg });
      setChatReply(res.data.reply);
    } catch {
      setChatReply('Sorry, I could not process your request right now.');
    } finally {
      setChatLoading(false);
    }
  };

  const priorityVariants: Record<string, any> = { LOW: 'default', MEDIUM: 'warning', HIGH: 'danger', URGENT: 'danger' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={`Good Evening, ${user?.name}`} description="Your household status at a glance" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Pending Tasks" value={stats?.pendingTasks ?? 0} icon={<ClipboardList size={22} />} color="amber" />
        <StatCard title="Pantry Items" value={stats?.pantryItems ?? 0} icon={<CookingPot size={22} />} color="emerald" />
        <StatCard title="Total Visitors" value={stats?.visitors ?? 0} icon={<KeyRound size={22} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
            <ClipboardList size={18} className="text-amber-500" />
            <span>Pending Tasks</span>
          </h2>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">All tasks are up to date!</p>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((t: any) => (
                <div key={t.id} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.assignedStaff?.name || 'Unassigned'}</p>
                  </div>
                  <Badge label={t.priority} variant={priorityVariants[t.priority]} />
                </div>
              ))}
            </div>
          )}
          <a href="/honour/tasks" className="mt-4 block text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            View All Tasks →
          </a>
        </div>

        {/* AI Butler Chat */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
            <Sparkles size={18} className="text-indigo-500" />
            <span>Ask Butler AI</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Ask about staff on duty, pantry status, tasks, visitors — in English or Hindi.</p>

          {chatReply && (
            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl">
              <div className="flex items-start space-x-2">
                <MessageSquare size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-sm text-indigo-800 dark:text-indigo-200">{chatReply}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <input
              type="text"
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askButler()}
              placeholder="e.g. Who is on duty today?"
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              onClick={askButler}
              disabled={chatLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60 transition"
            >
              {chatLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
