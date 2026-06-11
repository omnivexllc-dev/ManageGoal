import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Zap, CheckCircle2, TrendingUp, BarChart3, Lock, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900">ManageGoal CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={handleGetStarted}
              className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto">
          The simpler way to <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">manage goals & grow.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          ManageGoal CRM helps teams organize leads, track customer success, and stay on top of daily tasks without the clutter of traditional CRMs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-medium text-lg rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
          >
            Start your 14-day free trial
            <Zap className="w-5 h-5" />
          </button>
          <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-medium text-lg rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-center">
            View Pricing
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto border-t border-slate-100">
          <div className="text-center mb-16 pt-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to close more deals</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Powerful features wrapped in a beautifully simple interface.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Users,
                title: 'Pipeline Management',
                desc: 'Track leads from prospect to closed deal. Drag and drop simplicity with powerful AI summaries.'
              },
              {
                icon: CheckCircle2,
                title: 'Task Automation',
                desc: 'Never let a follow-up fall through the cracks. Built-in task tracking connected directly to your customers.'
              },
              {
                icon: BarChart3,
                title: 'Customer Insights',
                desc: 'A unified view of your customers. See their history, value, and current status in one clean dashboard.'
              }
            ].map((Feature, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 mb-6 mx-auto lg:mx-0">
                  <Feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{Feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{Feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Integration */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 text-white/5">
            <Target className="w-64 h-64" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Stop wrestling with your CRM.</h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg mb-10 relative z-10">
            Join modern sales and success teams who prioritize relationships over data entry. Spend less time managing software and more time managing goals.
          </p>
          <button 
            onClick={handleGetStarted}
            className="bg-white text-slate-900 px-8 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors relative z-10"
          >
            Create Your Account
          </button>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Essential Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Essential</h3>
              <p className="text-slate-500 mb-6">Perfect for individuals and small teams getting started.</p>
              <div className="mb-6 flex items-baseline">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500 ml-2">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Up to 100 Active Leads',
                  'Basic Task Management',
                  'Standard Support',
                  '1 Team Member'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-slate-900 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl font-medium border border-slate-200 text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Start for free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-white relative shadow-2xl">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-white text-slate-900 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">ManageGoal Pro</h3>
              <p className="text-slate-400 mb-6">For growing businesses that need AI and automation.</p>
              <div className="mb-6 flex items-baseline">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-slate-400 ml-2">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited Leads & Customers',
                  'AI Lead Summarization',
                  'Advanced Automation Features',
                  'Priority 24/7 Support',
                  'Unlimited Team Members'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl font-medium bg-white text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-slate-900" />
            <span className="font-semibold text-slate-900">ManageGoal CRM</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} ManageGoal CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
