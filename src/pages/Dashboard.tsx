import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, DollarSign, CheckCircle2 } from 'lucide-react';

const mockData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4200 },
  { name: 'May', revenue: 7000 },
  { name: 'Jun', revenue: 8500 },
];

export function Dashboard() {
  const { profile } = useAuth();
  const { leads, customers, tasks } = useData();

  const totalValue = leads.filter(l => l.status === 'Won').reduce((acc, l) => acc + (l.value || 0), 0);
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome back, {profile?.name}</h1>
        <p className="text-slate-500">Here's your sales and activity overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Leads" value={leads.length} icon={<Users size={24} className="text-blue-500" />} />
        <StatCard title="Active Customers" value={customers.length} icon={<UserCheck size={24} className="text-emerald-500" />} />
        <StatCard title="Revenue (Won)" value={`$${totalValue.toLocaleString()}`} icon={<DollarSign size={24} className="text-blue-500" />} />
        <StatCard title="Tasks Completed" value={`${doneTasks.length} / ${tasks.length}`} icon={<CheckCircle2 size={24} className="text-indigo-500" />} />
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold mb-6 text-slate-900">Revenue Forecast</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
      <div className="text-sm text-slate-400 font-medium mb-1">
        {title}
      </div>
      <div className="flex items-end justify-between gap-2 mt-4">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      </div>
    </div>
  );
}
