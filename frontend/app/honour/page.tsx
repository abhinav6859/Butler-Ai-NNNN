'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StatCard, PageHeader, Badge, LoadingSpinner } from '@/components/ui';
import api from '@/services/api';
import {
  ClipboardList, CookingPot, KeyRound,
  Sparkles, Send, MessageSquare,
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';

// ---------- PRIORITY META (for consistency) ----------
const priorityVariants: Record<string, any> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'danger',
  URGENT: 'danger',
};

export default function HonourDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat states
  const [chatMsg, setChatMsg] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for speech
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ---------- DATA FETCHING WITH TIMEOUT ----------
  useEffect(() => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      // If still loading after 6 seconds, force stop
      setLoading(false);
      setError('Loading took too long. Please refresh the page.');
    }, 6000);

    const fetchData = async () => {
      try {
        const [pendingRes, allTasksRes, pantryRes, visitorsRes] = await Promise.all([
          api.get('/tasks?status=PENDING&limit=5', { signal: abortController.signal }),
          api.get('/tasks?limit=1', { signal: abortController.signal }),
          api.get('/pantry?limit=1', { signal: abortController.signal }),
          api.get('/visitors?limit=1', { signal: abortController.signal }),
        ]);

        setPendingTasks(pendingRes.data.data || []);
        setStats({
          pendingTasks: allTasksRes.data.pagination?.total || 0,
          pantryItems: pantryRes.data.pagination?.total || 0,
          visitors: visitorsRes.data.pagination?.total || 0,
        });
        setError(null);
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  // ---------- SPEECH RECOGNITION ----------
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
          setChatMsg(transcript.trim());
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

  // ---------- TEXT‑TO‑SPEECH ----------
  const speakReply = () => {
    if (!window.speechSynthesis) {
      alert('Text‑to‑speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!chatReply) return;

    const utterance = new SpeechSynthesisUtterance(chatReply);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking when new reply arrives
  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [chatReply]);

  // ---------- CHAT HANDLER ----------
  const askButler = async () => {
    if (!chatMsg.trim()) return;
    setChatLoading(true);
    setChatReply('');
    try {
      const res = await api.post('/ai/chat', { message: chatMsg });
      setChatReply(res.data.reply);
    } catch (err) {
      console.error('Butler error:', err);
      setChatReply('Sorry, I could not process your request right now.');
    } finally {
      setChatLoading(false);
    }
  };

  // ---------- RENDER ----------
  if (loading) return <LoadingSpinner />;

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
      <PageHeader title={`Good Evening, ${user?.name}`} description="Your household status at a glance" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="Pending Tasks" value={stats?.pendingTasks ?? 0} icon={<ClipboardList size={22} />} color="amber" />
        <StatCard title="Pantry Items" value={stats?.pantryItems ?? 0} icon={<CookingPot size={22} />} color="emerald" />
        <StatCard title="Total Visitors" value={stats?.visitors ?? 0} icon={<KeyRound size={22} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks - unchanged */}
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

        {/* AI Butler Chat - with voice buttons */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60 p-6">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
            <Sparkles size={18} className="text-indigo-500" />
            <span>Ask Butler AI</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Ask about staff, pantry, tasks, visitors — in English or Hindi.
            <br />
            <span className="text-indigo-500">🎤 Click the mic to speak</span> · <span className="text-indigo-500">🔊 Click the speaker to hear the reply</span>
          </p>

          {chatReply && (
            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-xl">
              <div className="flex items-start space-x-2">
                <MessageSquare size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-sm text-indigo-800 dark:text-indigo-200 flex-1">{chatReply}</p>
                {window.speechSynthesis && (
                  <button
                    onClick={speakReply}
                    className="p-1.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition text-indigo-600 dark:text-indigo-300"
                    aria-label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  >
                    {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
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

            {recognitionRef.current && (
              <button
                onClick={toggleRecording}
                className={`px-3 py-2.5 rounded-xl transition ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            <button
              onClick={askButler}
              disabled={chatLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60 transition"
            >
              {chatLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          {isRecording && (
            <p className="text-xs text-red-500 mt-2 animate-pulse flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Listening... speak your question
            </p>
          )}
        </div>
      </div>
    </div>
  );
}