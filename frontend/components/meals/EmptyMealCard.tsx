'use client';

import { CalendarDays, ClipboardList } from 'lucide-react';

interface EmptyMealCardProps {
  date: Date;
}

export default function EmptyMealCard({
  date,
}: EmptyMealCardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let title = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (date.getTime() === today.getTime()) {
    title = 'Today';
  } else if (date.getTime() === yesterday.getTime()) {
    title = 'Yesterday';
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-6 py-4">

        <CalendarDays
          size={20}
          className="text-slate-400"
        />

        <div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </h3>

          <p className="text-xs text-slate-500">
            {date.toLocaleDateString('en-IN')}
          </p>
        </div>

      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-10 px-6">

        <div className="mb-4 rounded-full bg-slate-200 dark:bg-slate-800 p-4">
          <ClipboardList
            size={32}
            className="text-slate-500"
          />
        </div>

        <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          No meal added
        </h4>

        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          No confirmed meal plan is available for this day.
        </p>

      </div>
    </div>
  );
}