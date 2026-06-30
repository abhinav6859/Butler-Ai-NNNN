'use client';

import { PageHeader } from '@/components/ui';
import { Sparkles, Bot, Languages, Brain, ShoppingCart, MessageSquare } from 'lucide-react';

export default function AdminAIPage() {
  return (
    <div>
      <PageHeader title="AI Settings" description="Configure AI assistant capabilities for Butler AI" />

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Butler AI Assistant</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                AI features are running in <strong className="text-purple-600">Rule-Based Mode</strong>. To unlock advanced AI capabilities powered by Google Gemini, add your API key to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">GEMINI_API_KEY</code> in the backend <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env</code> file.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">AI Capabilities</h3>
          <div className="space-y-4">
            {[
              { icon: <Languages size={18} />, title: 'English & Hindi Task Parsing', desc: 'Convert natural language instructions in English, Hindi, or Hinglish into structured tasks with assigned staff, priority, category, and due date.' },
              { icon: <Brain size={18} />, title: 'Meal Suggestions from Pantry', desc: 'Analyze available pantry ingredients and match them against recipes to suggest meals that can be prepared with existing stock.' },
              { icon: <ShoppingCart size={18} />, title: 'Grocery Auto-Suggestions', desc: 'Detect low-stock pantry items and auto-generate grocery purchase recommendations.' },
              { icon: <MessageSquare size={18} />, title: 'Smart Q&A Chat', desc: 'Ask questions about household operations — staff on duty, pending tasks, pantry status, and visitor logs.' },
              { icon: <Bot size={18} />, title: 'Report Summarization', desc: 'Automatically generate concise, human-readable summaries from raw operational data reports.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
