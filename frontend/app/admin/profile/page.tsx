'use client';

import { useAuth } from '@/hooks/useAuth';
import { PageHeader, Badge } from '@/components/ui';
import { User, Mail, ShieldCheck, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" description="Your account information and settings" />

      <div className="max-w-2xl">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-8">
          {/* Avatar */}
          <div className="flex items-center space-x-5 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/20">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
              <div className="mt-2 flex items-center space-x-2">
                <Badge label={user.role} variant="indigo" />
                {user.staffType && <Badge label={user.staffType} variant="default" />}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={<User size={18} />} label="Full Name" value={user.name} />
            <InfoRow icon={<Mail size={18} />} label="Email Address" value={user.email} />
            <InfoRow icon={<ShieldCheck size={18} />} label="Account Role" value={user.role} />
            <InfoRow icon={<Briefcase size={18} />} label="Staff Type" value={user.staffType || 'N/A'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
