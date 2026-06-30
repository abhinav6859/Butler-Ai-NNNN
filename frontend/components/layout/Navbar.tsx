'use client';

import { useAuth } from '@/hooks/useAuth';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Butler AI
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20 uppercase tracking-wide">
          Phase 1
        </span>
      </div>

      <div className="flex items-center space-x-6">
        {/* Notification indicator */}
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition duration-200">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
        </button>

        {/* User Info tag */}
        <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            {user.name ? user.name[0].toUpperCase() : <UserIcon size={18} />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user.name}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {user.role} {user.staffType ? `(${user.staffType})` : ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Logout"
          className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-full transition duration-200"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
