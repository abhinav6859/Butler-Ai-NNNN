'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import { LoadingSpinner } from '@/components/ui';
import MealHistoryCard from './MealHistoryCard';
import EmptyMealCard from './EmptyMealCard';

export interface MealPlan {
  id?: string;
  date: string;
  breakfastName?: string;
  lunchName?: string;
  dinnerName?: string;
  status?: string;
}

interface MealHistoryProps {
  days?: number;
  editable?: boolean;
  showEditButton?: boolean;
  onEdit?: (meal: MealPlan) => void;
}

export default function MealHistory({
  days = 7,
  editable = false,
  showEditButton = false,
  onEdit,
}: MealHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<MealPlan[]>([]);

  const fetchMeals = useCallback(async () => {
    setLoading(true);

    try {
      // Change this endpoint if your backend differs
      const res = await api.get(`/meal-plans?limit=100`);

      setMeals(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const createHistory = () => {
    const history: {
      date: Date;
      meal?: MealPlan;
    }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const dateString = date.toISOString().split('T')[0];

      const meal = meals.find((m) =>
        m.date?.startsWith(dateString)
      );

      history.push({
        date,
        meal,
      });
    }

    return history;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  const history = createHistory();

  return (
    <div className="mt-10">

      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Previous {days} Days
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Meal history for the last {days} days.
        </p>
      </div>

      <div className="space-y-5">
        {history.map(({ date, meal }) =>
          meal ? (
            <MealHistoryCard
              key={date.toISOString()}
              meal={meal}
              date={date}
              editable={editable}
              showEditButton={showEditButton}
              onEdit={onEdit}
            />
          ) : (
            <EmptyMealCard
              key={date.toISOString()}
              date={date}
            />
          )
        )}
      </div>
    </div>
  );
}