import React from 'react';
import { useData } from '../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#0ea5e9'];

export function Analytics() {
  const { leads, loadingLeads } = useData();

  if (loadingLeads) {
    return <div className="p-8 text-slate-500 font-medium">Loading analytics...</div>;
  }

  // Calculate pipeline metrics
  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const wonLeads = leads.filter(l => l.status === 'Won');
  const wonValue = wonLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const winRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  // Group leads by status for pipeline chart
  const pipelineData = [
    { name: 'New', value: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length },
    { name: 'Proposal', value: leads.filter(l => l.status === 'Proposal').length },
    { name: 'Negotiation', value: leads.filter(l => l.status === 'Negotiation').length },
    { name: 'Won', value: leads.filter(l => l.status === 'Won').length },
    { name: 'Lost', value: leads.filter(l => l.status === 'Lost').length }
  ].filter(item => item.value > 0);

  // Top companies by value
  const companyDataMap = leads.reduce((acc, lead) => {
    if (lead.company) {
      acc[lead.company] = (acc[lead.company] || 0) + (lead.value || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const companyData = Object.entries(companyDataMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Reports & Analytics</h1>
        <p className="text-slate-500">Advanced insights into your pipeline and sales performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Total Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: 'Closed Won Value', value: `$${wonValue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { title: 'Overall Win Rate', value: `${winRate}%`, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { title: 'Active Leads', value: leads.length, icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' }
        ].map((metric, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl ${metric.bg} ${metric.color} flex items-center justify-center mb-4`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{metric.title}</p>
            <h3 className="text-3xl font-bold text-slate-900">{metric.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pipeline by Stage</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Deals by Company ($)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={companyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {companyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Pipeline Value']}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', color: '#64748B'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
