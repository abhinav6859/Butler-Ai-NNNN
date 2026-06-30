import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  trend?: { value: number; label: string };
}

const colorMap = {
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
  emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
  amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
  rose: 'from-rose-500 to-rose-600 shadow-rose-500/20',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
};

const bgMap = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export function StatCard({ title, value, subtitle, icon, color = 'indigo', trend }: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 bg-white dark:bg-slate-900/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.value >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        {description && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'indigo' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {label}
    </span>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizes[size]} border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-500 rounded-full animate-spin`} />
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-16">
      {icon && <div className="flex justify-center text-slate-300 dark:text-slate-700 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">{title}</h3>
      {description && <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">{description}</p>}
    </div>
  );
}
