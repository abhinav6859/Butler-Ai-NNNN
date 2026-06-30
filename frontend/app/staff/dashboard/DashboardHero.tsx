'use client';

import { useEffect, useState } from 'react';
import {
  ChefHat,
  Car,
  ShieldCheck,
  Sparkles,
  Brush,
  User,
  Flower2,
  Baby,
  Crown,
} from 'lucide-react';

interface DashboardHeroProps {
  userName: string;
  staffType: string;
  subtitle?: string;
}

const roleConfig: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  label: string;
  greeting: string;
}> = {
  CHEF: {
    icon: <ChefHat size={28} />,
    gradient: 'from-orange-500 via-rose-500 to-pink-600',
    glowColor: 'shadow-orange-500/25',
    label: 'Chef',
    greeting: 'Ready to cook up something amazing?',
  },
  DRIVER: {
    icon: <Car size={28} />,
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    glowColor: 'shadow-blue-500/25',
    label: 'Driver',
    greeting: 'Your routes await — drive safe!',
  },
  SECURITY: {
    icon: <ShieldCheck size={28} />,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    glowColor: 'shadow-amber-500/25',
    label: 'Security Guard',
    greeting: 'Keep the premises safe and secure.',
  },
  HOUSEKEEPER: {
    icon: <Brush size={28} />,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-500/25',
    label: 'Housekeeper',
    greeting: 'Time to make everything sparkle!',
  },
  MAID: {
    icon: <Sparkles size={28} />,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    glowColor: 'shadow-emerald-500/25',
    label: 'Maid',
    greeting: 'Time to make everything sparkle!',
  },
  GARDENER: {
    icon: <Flower2 size={28} />,
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    glowColor: 'shadow-green-500/25',
    label: 'Gardener',
    greeting: 'Let the garden flourish today!',
  },
  NANNY: {
    icon: <Baby size={28} />,
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
    glowColor: 'shadow-pink-500/25',
    label: 'Nanny',
    greeting: 'Taking care with love and joy.',
  },
  BUTLER: {
    icon: <Crown size={28} />,
    gradient: 'from-indigo-500 via-purple-500 to-violet-600',
    glowColor: 'shadow-indigo-500/25',
    label: 'Butler',
    greeting: 'At your service — excellence in every detail.',
  },
  OTHER: {
    icon: <User size={28} />,
    gradient: 'from-slate-500 via-gray-500 to-zinc-600',
    glowColor: 'shadow-slate-500/25',
    label: 'Staff',
    greeting: 'Have a productive day!',
  },
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardHero({ userName, staffType, subtitle }: DashboardHeroProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const config = roleConfig[staffType] || roleConfig.OTHER;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} p-6 md:p-8 mb-6 shadow-xl ${config.glowColor}`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
      <div className="absolute top-4 right-6 opacity-10">
        <div className="transform scale-[3]">{config.icon}</div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-white/15 backdrop-blur-sm rounded-xl">
              <span className="text-white">{config.icon}</span>
            </div>
            <span className="text-white/60 text-sm font-medium uppercase tracking-wider">
              {config.label} Dashboard
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {getTimeOfDay()}, {userName.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/70 text-sm">
            {subtitle || config.greeting}
          </p>
        </div>

        <div className="flex flex-col items-end text-right">
          <p className="text-white/90 text-sm font-semibold">
            {currentTime.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            {currentTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
