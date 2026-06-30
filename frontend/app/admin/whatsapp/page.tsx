'use client';

import { PageHeader } from '@/components/ui';
import { Smartphone, MessageSquare, CheckCircle } from 'lucide-react';

export default function AdminWhatsAppPage() {
  return (
    <div>
      <PageHeader title="WhatsApp Settings" description="Configure the WhatsApp notification gateway" />

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Smartphone size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">WhatsApp Integration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Butler AI dispatches all notifications via WhatsApp only. Currently operating in <strong className="text-emerald-600">Simulation Mode</strong> — all messages are logged to the database and displayed in the Notifications dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Active Notification Types</h3>
          <div className="space-y-3">
            {[
              { type: 'Task Assigned', desc: 'When a new task is assigned to a staff member' },
              { type: 'Task Completed', desc: 'When a task is marked as complete' },
              { type: 'Meal Ready', desc: 'When a meal is prepared and ready to serve' },
              { type: 'Low Pantry Stock', desc: 'When pantry item quantity falls below minimum threshold' },
              { type: 'Visitor Arrived', desc: 'When a visitor checks in at the gate' },
              { type: 'Grocery Request', desc: 'When a new grocery item is requested' },
              { type: 'Daily/Weekly Summary', desc: 'Automated operational summary reports' },
            ].map((item) => (
              <div key={item.type} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.type}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">Production Setup</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                To connect a real WhatsApp Business API, supply your Meta/Twilio credentials in the backend <code className="bg-indigo-100 dark:bg-indigo-800 px-1 rounded">.env</code> file. The WhatsApp service will automatically switch from simulation to live dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
