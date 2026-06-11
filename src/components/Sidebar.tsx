import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, CheckSquare, Settings, LogOut, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { signOut } from '../lib/firebase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Customers', path: '/customers', icon: UserCheck },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Automation', path: '/automation', icon: Zap },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (val: boolean) => void }) {
  return (
    <div className={cn("hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300", collapsed ? "w-20" : "w-64")}>
      <div className="flex h-20 items-center justify-between px-6 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">ManageGoal</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              )
            }
          >
            <item.icon size={20} className={cn("shrink-0", collapsed && "mx-auto")} />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <LogOut size={20} className={cn("shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
