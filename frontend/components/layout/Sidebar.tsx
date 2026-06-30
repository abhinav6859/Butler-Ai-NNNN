'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Home,
  Users,
  UserCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  ClipboardList,
  CookingPot,
  ShoppingBag,
  BellRing,
  BookOpen,
  CalendarDays,
  FileText,
  User,
  Car,
  KeyRound,
  Trash2,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  // Navigation Links based on Role
  const renderLinks = () => {
    if (user.role === 'ADMIN') {
      return (
        <>
          <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/admin')} />
          <SidebarLink href="/admin/homes" icon={<Home size={20} />} label="Homes" active={isActive('/admin/homes')} />
          <SidebarLink href="/admin/staff" icon={<UserCheck size={20} />} label="Staff" active={isActive('/admin/staff')} />
          <SidebarLink href="/admin/users" icon={<Users size={20} />} label="Users" active={isActive('/admin/users')} />
          <SidebarLink href="/admin/whatsapp" icon={<Smartphone size={20} />} label="WhatsApp Settings" active={isActive('/admin/whatsapp')} />
          <SidebarLink href="/admin/ai" icon={<Sparkles size={20} />} label="AI Settings" active={isActive('/admin/ai')} />
          <SidebarLink href="/admin/reports" icon={<FileText size={20} />} label="Reports" active={isActive('/admin/reports')} />
          <SidebarLink href="/admin/notifications" icon={<BellRing size={20} />} label="Notifications" active={isActive('/admin/notifications')} />
          <SidebarLink href="/admin/profile" icon={<User size={20} />} label="Profile" active={isActive('/admin/profile')} />
        </>
      );
    }

    if (user.role === 'HONOUR') {
      return (
        <>
          <SidebarLink href="/honour" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/honour')} />
          <SidebarLink href="/honour/tasks" icon={<ClipboardList size={20} />} label="Today's Tasks" active={isActive('/honour/tasks')} />
          <SidebarLink href="/honour/staff" icon={<UserCheck size={20} />} label="Staff Status" active={isActive('/honour/staff')} />
          <SidebarLink href="/honour/pantry" icon={<CookingPot size={20} />} label="Pantry" active={isActive('/honour/pantry')} />
          <SidebarLink href="/honour/meals" icon={<CalendarDays size={20} />} label="Meals" active={isActive('/honour/meals')} />
          <SidebarLink href="/honour/groceries" icon={<ShoppingBag size={20} />} label="Groceries" active={isActive('/honour/groceries')} />
          <SidebarLink href="/honour/visitors" icon={<KeyRound size={20} />} label="Visitors" active={isActive('/honour/visitors')} />
          <SidebarLink href="/honour/reports" icon={<FileText size={20} />} label="Reports" active={isActive('/honour/reports')} />
          <SidebarLink href="/honour/notifications" icon={<BellRing size={20} />} label="Notifications" active={isActive('/honour/notifications')} />
          <SidebarLink href="/honour/profile" icon={<User size={20} />} label="Profile" active={isActive('/honour/profile')} />
        </>
      );
    }

    if (user.role === 'STAFF') {
      return (
        <>
          <SidebarLink href="/staff" icon={<LayoutDashboard size={20} />} label="Dashboard" active={isActive('/staff')} />
          <SidebarLink href="/staff/tasks" icon={<ClipboardList size={20} />} label="My Tasks" active={isActive('/staff/tasks')} />
          <SidebarLink href="/staff/attendance" icon={<UserCheck size={20} />} label="Attendance" active={isActive('/staff/attendance')} />
          <SidebarLink href="/staff/notifications" icon={<BellRing size={20} />} label="Notifications" active={isActive('/staff/notifications')} />
          <SidebarLink href="/staff/profile" icon={<User size={20} />} label="Profile" active={isActive('/staff/profile')} />

          {/* Conditional modules based on StaffType */}
          {user.staffType === 'CHEF' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Kitchen Modules
              </div>
              <SidebarLink href="/staff/pantry" icon={<CookingPot size={20} />} label="Pantry Management" active={isActive('/staff/pantry')} />
              <SidebarLink href="/staff/recipes" icon={<BookOpen size={20} />} label="Recipes Book" active={isActive('/staff/recipes')} />
              <SidebarLink href="/staff/meal-plan" icon={<CalendarDays size={20} />} label="Meal Planner" active={isActive('/staff/meal-plan')} />
            </>
          )}

          {user.staffType === 'SECURITY' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Security Modules
              </div>
              <SidebarLink href="/staff/visitors" icon={<KeyRound size={20} />} label="Visitor Check-In" active={isActive('/staff/visitors')} />
            </>
          )}

          {user.staffType === 'DRIVER' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Driver Modules
              </div>
              <SidebarLink href="/staff/trips" icon={<Car size={20} />} label="Trips & Duties" active={isActive('/staff/trips')} />
            </>
          )}

          {(user.staffType === 'HOUSEKEEPER' || user.staffType === 'MAID') && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Housekeeping Modules
              </div>
              <SidebarLink href="/staff/cleaning" icon={<ClipboardList size={20} />} label="Cleaning Tasks" active={isActive('/staff/cleaning')} />
            </>
          )}

          {user.staffType === 'GARDENER' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Gardening Modules
              </div>
              <SidebarLink href="/staff/gardening" icon={<ClipboardList size={20} />} label="Gardening Tasks" active={isActive('/staff/gardening')} />
            </>
          )}

          {user.staffType === 'NANNY' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Childcare Modules
              </div>
              <SidebarLink href="/staff/childcare" icon={<ClipboardList size={20} />} label="Childcare Duties" active={isActive('/staff/childcare')} />
            </>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <aside className="w-64 glass-sidebar min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 shrink-0">
      <div className="space-y-1 select-none">
        <div className="px-3 mb-6">
          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
            Control Center
          </p>
        </div>
        {renderLinks()}
      </div>

      <div className="px-3 border-t border-slate-200 dark:border-slate-800/80 pt-6">
        <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
          <ShieldCheck size={18} />
          <span className="text-xs font-medium tracking-wide">Secure Operations</span>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-200 ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-slate-800'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600'}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
