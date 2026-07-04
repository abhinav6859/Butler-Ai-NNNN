'use client';

import {
  Coffee,
  Sun,
  Moon,
  CalendarDays,
  Pencil,
  CheckCircle2,
} from 'lucide-react';

import { MealPlan } from './MealHistory';

interface Props {
  meal: MealPlan;
  date: Date;
  editable?: boolean;
  showEditButton?: boolean;
  onEdit?: (meal: MealPlan) => void;
}

export default function MealHistoryCard({
  meal,
  date,
  editable = false,
  showEditButton = false,
  onEdit,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dayLabel = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (date.getTime() === today.getTime()) {
    dayLabel = 'Today';
  }

  if (date.getTime() === yesterday.getTime()) {
    dayLabel = 'Yesterday';
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">

        <div className="flex items-center gap-3">
          <CalendarDays
            className="text-indigo-600"
            size={20}
          />

          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              {dayLabel}
            </h3>

            <p className="text-xs text-slate-500">
              {date.toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">

          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            {meal.status || 'Confirmed'}
          </span>

          {editable && showEditButton && (
            <button
              onClick={() => onEdit?.(meal)}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
            >
              <span className="flex items-center gap-2">
                <Pencil size={15} />
                Edit
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Meals */}

      <div className="grid gap-4 p-6 md:grid-cols-3">

        {/* Breakfast */}

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-4">

          <div className="mb-2 flex items-center gap-2">

            <Coffee
              className="text-amber-600"
              size={18}
            />

            <h4 className="font-semibold text-slate-700 dark:text-slate-200">
              Breakfast
            </h4>

          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {meal.breakfastName || 'No meal added'}
          </p>

        </div>

        {/* Lunch */}

        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 p-4">

          <div className="mb-2 flex items-center gap-2">

            <Sun
              className="text-indigo-600"
              size={18}
            />

            <h4 className="font-semibold text-slate-700 dark:text-slate-200">
              Lunch
            </h4>

          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {meal.lunchName || 'No meal added'}
          </p>

        </div>

        {/* Dinner */}

        <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 p-4">

          <div className="mb-2 flex items-center gap-2">

            <Moon
              className="text-purple-600"
              size={18}
            />

            <h4 className="font-semibold text-slate-700 dark:text-slate-200">
              Dinner
            </h4>

          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {meal.dinnerName || 'No meal added'}
          </p>

        </div>

      </div>

    </div>
  );
}