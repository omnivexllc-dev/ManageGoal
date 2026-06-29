import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, DollarSign, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { db, doc, updateDoc } from '../lib/firebase';
import toast from 'react-hot-toast';

const mockData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4200 },
  { name: 'May', revenue: 7000 },
  { name: 'Jun', revenue: 8500 },
];

export function Dashboard() {
  const { user, profile } = useAuth();
  const { leads, customers, tasks } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [completingPayment, setCompletingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  useEffect(() => {
    const gateway = searchParams.get('gateway');
    const sessionId = searchParams.get('amazonPayCheckoutSessionId');

    if (gateway === 'amazonpay' && sessionId && user) {
      setCompletingPayment(true);
      
      // Call backend to verify checkout session
      fetch('/api/amazon-pay/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      .then(res => {
        if (!res.ok) throw new Error('Verification failed');
        return res.json();
      })
      .then(async (data) => {
        // Upgrade user in firestore
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          plan: `${data.plan} (Amazon Pay)`,
          updatedAt: Date.now()
        });
        setPaymentSuccessData(data);
        toast.success(`Success! Upgraded to ${data.plan} via Amazon Pay!`);
        
        // Remove query parameters from URL for a clean state
        setSearchParams({}, { replace: true });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Could not verify your Amazon Pay checkout. Please contact support.');
      })
      .finally(() => {
        setCompletingPayment(false);
      });
    }
  }, [searchParams, user, setSearchParams]);

  const totalValue = leads.filter(l => l.status === 'Won').reduce((acc, l) => acc + (l.value || 0), 0);
  const doneTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {completingPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 flex items-center gap-4 text-amber-900 shadow-sm animate-pulse">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin shrink-0" />
          <div>
            <h3 className="font-bold text-base">Verifying Your Amazon Pay Checkout...</h3>
            <p className="text-sm text-amber-700 mt-0.5">Please wait while we establish a secure connection with Amazon and upgrade your account.</p>
          </div>
        </div>
      )}

      {paymentSuccessData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex items-start gap-4 text-emerald-900 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg">Thank You for Upgrading!</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Your payment of <strong className="text-emerald-950">${paymentSuccessData.amount}</strong> was approved by Amazon Pay. 
              The <strong className="text-emerald-950">{paymentSuccessData.plan}</strong> privileges have been instantly unlocked for your account.
            </p>
          </div>
        </div>
      )}

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
