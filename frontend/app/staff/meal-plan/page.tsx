'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import { Modal, FormField, inputClass } from '@/components/ui/Modal';
import api from '@/services/api';
import { Plus, ChevronLeft, ChevronRight, Coffee, Sun, Moon, Sparkles, Bell } from 'lucide-react';

function getWeekDays(startDate: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function StaffMealPlanPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0,0,0,0);
    return d;
  });
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // AI Suggestions States
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { register, handleSubmit, reset } = useForm<any>();
  const days = getWeekDays(weekStart);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/meal-plans?limit=50');
      setPlans(res.data.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchAiSuggestions = useCallback(async () => {
    setLoadingAi(true);
    try {
      const res = await api.get('/ai/suggest-meals');
      setAiSuggestions(res.data || []);
    } catch {} finally { setLoadingAi(false); }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchAiSuggestions();
  }, [fetchPlans, fetchAiSuggestions]);

  const getPlanForDate = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return plans.find((p: any) => p.date?.startsWith(ds));
  };

  const openForDate = (date: Date, existing?: any) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    setEditingItem(existing || null);
    reset({ breakfastName: existing?.breakfastName || '', lunchName: existing?.lunchName || '', dinnerName: existing?.dinnerName || '' });
    setModalOpen(true);
  };

  const onSubmit = async (fd: any) => {
    setSaving(true);
    try {
      if (editingItem) { await api.put(`/meal-plans/${editingItem.id}`, fd); }
      else { await api.post('/meal-plans', { ...fd, date: selectedDate }); }
      setModalOpen(false); fetchPlans();
      setMessage('✅ Meal plan updated successfully!');
    } catch {} finally { setSaving(false); }
  };

  const applyAISuggestion = async (recipeName: string, mealType: 'breakfastName' | 'lunchName' | 'dinnerName') => {
    const existing = plans.find((p: any) => p.date?.startsWith(targetDate));
    const payload = {
      breakfastName: existing?.breakfastName || '',
      lunchName: existing?.lunchName || '',
      dinnerName: existing?.dinnerName || '',
      [mealType]: recipeName,
    };
    try {
      setLoading(true);
      if (existing) {
        await api.put(`/meal-plans/${existing.id}`, payload);
      } else {
        await api.post('/meal-plans', { ...payload, date: targetDate });
      }
      await fetchPlans();
      setMessage(`✅ Applied ${recipeName} to ${mealType.replace('Name', '')}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMealReadyAlert = async (planId: string, mealType: 'breakfastName' | 'lunchName' | 'dinnerName') => {
    const key = `${planId}-${mealType}`;
    setNotifyLoading(key);
    try {
      await api.post(`/meal-plans/${planId}/ready`, { mealType });
      setMessage(`📢 Sent WhatsApp alert: Meal is ready!`);
    } catch (err: any) {
      setMessage(`❌ Failed to send alert: ${err?.response?.data?.error || err.message}`);
    } finally {
      setNotifyLoading(null);
    }
  };

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };

  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div>
      <PageHeader title="Kitchen Meal Planner" description="Manage weekly meal schedules and trigger WhatsApp readiness alerts" />

      {message && (
        <div className="mb-6 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"><ChevronLeft size={20} /></button>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {days[0].toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {days[6].toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <button onClick={nextWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"><ChevronRight size={20} /></button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 mb-6">
        {days.map((day) => {
          const plan = getPlanForDate(day);
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={day.toISOString()}
              className={`rounded-2xl p-4 border cursor-pointer transition hover:border-indigo-400 flex flex-col justify-between min-h-[160px] ${isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900/50'}`}
              onClick={() => openForDate(day, plan)}
            >
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold mb-3 ${isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {day.getDate()}
                </p>
                {plan ? (
                  <div className="space-y-2 text-xs">
                    {plan.breakfastName && (
                      <div className="flex flex-col space-y-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-1 text-amber-600 font-semibold">
                          <Coffee size={10} />
                          <span className="truncate">{plan.breakfastName}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); sendMealReadyAlert(plan.id, 'breakfastName'); }}
                          disabled={notifyLoading === `${plan.id}-breakfastName`}
                          className="w-full py-0.5 px-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] rounded font-bold flex items-center justify-center space-x-1 disabled:opacity-50 transition"
                        >
                          <Bell size={8} />
                          <span>{notifyLoading === `${plan.id}-breakfastName` ? 'Alerting...' : 'Ready'}</span>
                        </button>
                      </div>
                    )}
                    {plan.lunchName && (
                      <div className="flex flex-col space-y-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-1 text-indigo-600 font-semibold">
                          <Sun size={10} />
                          <span className="truncate">{plan.lunchName}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); sendMealReadyAlert(plan.id, 'lunchName'); }}
                          disabled={notifyLoading === `${plan.id}-lunchName`}
                          className="w-full py-0.5 px-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] rounded font-bold flex items-center justify-center space-x-1 disabled:opacity-50 transition"
                        >
                          <Bell size={8} />
                          <span>{notifyLoading === `${plan.id}-lunchName` ? 'Alerting...' : 'Ready'}</span>
                        </button>
                      </div>
                    )}
                    {plan.dinnerName && (
                      <div className="flex flex-col space-y-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center space-x-1 text-purple-600 font-semibold">
                          <Moon size={10} />
                          <span className="truncate">{plan.dinnerName}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); sendMealReadyAlert(plan.id, 'dinnerName'); }}
                          disabled={notifyLoading === `${plan.id}-dinnerName`}
                          className="w-full py-0.5 px-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] rounded font-bold flex items-center justify-center space-x-1 disabled:opacity-50 transition"
                        >
                          <Bell size={8} />
                          <span>{notifyLoading === `${plan.id}-dinnerName` ? 'Alerting...' : 'Ready'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-10">
                    <Plus size={18} className="text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Meal Suggestions Panel */}
      <div className="mt-8 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Sparkles className="text-indigo-500 animate-pulse" size={20} />
              <span>AI Meal Planner (Pantry-Optimized)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Suggestions based on ingredients currently available in your pantry
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Day:</span>
            <select
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {days.map((d) => {
                const dateStr = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                return (
                  <option key={dateStr} value={dateStr}>
                    {label} {dateStr === today.toISOString().split('T')[0] ? '(Today)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {loadingAi ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : aiSuggestions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No recipes found. Add some recipes or update pantry stock!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiSuggestions.map((sug) => (
              <div key={sug.id} className="flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl hover:border-indigo-500/30 transition duration-200">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{sug.name}</h4>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${sug.canCook ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'}`}>
                      {sug.matchPercentage}% Ingredients
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Prep Time: {sug.prepTime} mins</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {sug.matchedIngredients} of {sug.totalIngredients} ingredients in stock
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 flex flex-wrap gap-2">
                  <button
                    onClick={() => applyAISuggestion(sug.name, 'breakfastName')}
                    className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 rounded-xl transition"
                  >
                    + Breakfast
                  </button>
                  <button
                    onClick={() => applyAISuggestion(sug.name, 'lunchName')}
                    className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 rounded-xl transition"
                  >
                    + Lunch
                  </button>
                  <button
                    onClick={() => applyAISuggestion(sug.name, 'dinnerName')}
                    className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 rounded-xl transition"
                  >
                    + Dinner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Meal Plan — ${selectedDate}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Breakfast">
            <input {...register('breakfastName')} className={inputClass} placeholder="e.g. Poha, Idli, Paratha" />
          </FormField>
          <FormField label="Lunch">
            <input {...register('lunchName')} className={inputClass} placeholder="e.g. Dal Makhani, Rice, Roti" />
          </FormField>
          <FormField label="Dinner">
            <input {...register('dinnerName')} className={inputClass} placeholder="e.g. Paneer Butter Masala, Naan" />
          </FormField>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition">
              {saving ? 'Saving...' : editingItem ? 'Update Plan' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
