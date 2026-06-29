import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, Users, Zap, CheckCircle2, TrendingUp, BarChart3, Lock, MessageSquare, Loader2, X, AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || '');

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<{ configured: boolean; hasSecretKey: boolean; hasPublicKey: boolean } | null>(null);
  const [showStripeGuide, setShowStripeGuide] = useState(false);

  useEffect(() => {
    fetch('/api/stripe/status')
      .then(res => res.json())
      .then(data => setStripeStatus(data))
      .catch(err => console.error('Error fetching Stripe status:', err));
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleUpgrade = async (plan: string, price: number) => {
    if (stripeStatus && !stripeStatus.configured) {
      setShowStripeGuide(true);
      return;
    }

    try {
      setLoadingPlan(plan);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, price }),
      });

      const data = await response.json().catch(() => null);
      if (!data) {
        throw new Error('Invalid response from payment server');
      }

      const { id, error } = data;
      
      if (error) {
        if (error.includes('STRIPE_SECRET_KEY') || error.includes('credentials')) {
          setShowStripeGuide(true);
        } else {
          alert(error);
        }
        return;
      }

      const stripe = await stripePromise;
      if (stripe) {
        const { error: redirectError } = await (stripe as any).redirectToCheckout({ sessionId: id });
        if (redirectError) {
          alert(`Stripe Redirect Error: ${redirectError.message}`);
        }
      } else {
        setShowStripeGuide(true);
      }
    } catch (e: any) {
      console.error(e);
      if (!(import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY) {
        setShowStripeGuide(true);
      } else {
        alert(`Failed to initiate checkout: ${e.message || 'Please check your connection and try again.'}`);
      }
    } finally {
      setLoadingPlan(null);
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

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Essential Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Essential</h3>
              <p className="text-slate-500 mb-6 flex-grow h-12">Perfect for individuals and small teams getting started.</p>
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
                  <li key={i} className="flex items-center text-slate-600 border-b border-white pb-1">
                    <CheckCircle2 className="w-5 h-5 text-slate-900 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl font-medium border border-slate-200 text-slate-900 hover:bg-slate-50 transition-colors mt-auto"
              >
                Start for free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-white relative shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-white text-slate-900 text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">ManageGoal Pro</h3>
              <p className="text-slate-400 mb-6 h-12">For growing businesses that need AI and automation.</p>
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
              <div className="mt-auto space-y-3">
                <button 
                  onClick={() => handleUpgrade('Pro', 29)}
                  disabled={loadingPlan === 'Pro'}
                  className="w-full py-3 rounded-xl font-medium bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {loadingPlan === 'Pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upgrade to Pro with Card'}
                </button>
                <Link
                  to="/amazon-pay"
                  className="w-full py-2.5 rounded-xl font-bold bg-[#FF9900] text-slate-950 hover:bg-[#E58A00] transition-colors flex items-center justify-center gap-2 text-xs border border-amber-600 shadow-sm"
                >
                  <span className="italic">amazon</span> pay
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow flex flex-col justify-between">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-500 mb-6 h-12">For large-scale organizations requiring custom solutions.</p>
              <div className="mb-6 flex items-baseline">
                <span className="text-4xl font-bold text-slate-900">$99</span>
                <span className="text-slate-500 ml-2">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Pro',
                  'Custom Report Builder',
                  'Dedicated Account Manager',
                  'White-label options',
                  'Advanced Data Import/Export',
                  'Custom Workflows'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-slate-900 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={handleGetStarted}
                className="w-full py-3 rounded-xl font-medium border border-slate-200 text-slate-900 hover:bg-slate-50 transition-colors mt-auto"
              >
                Contact Sales
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
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link to="/refund" className="hover:text-slate-900 transition-colors">Refund</Link>
            <a href="mailto:support@managegoal.com" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} ManageGoal CRM. All rights reserved.
          </p>
        </div>
      </footer>

      {showStripeGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowStripeGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-950">Stripe Integration Required</h3>
                <p className="text-sm text-slate-500 mt-1">
                  To accept live card payments, you need to connect your Stripe account. Here is how to configure it in 2 minutes:
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-slate-500" />
                  1. Get your API Keys from Stripe
                </h4>
                <p className="text-slate-600 mb-2 font-sans">
                  Sign in to your <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold">Stripe Dashboard <ExternalLink className="w-3 h-3" /></a>, toggle **"Test Mode"** on/off, then go to **Developers** &gt; **API Keys**.
                </p>
                <div className="space-y-1.5 font-mono text-xs bg-white p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Publishable key (pk_...)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Secret key (sk_...)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold font-sans">2</span>
                  Add them to AI Studio Settings
                </h4>
                <p className="text-slate-600 mb-3 font-sans">
                  Click the **Settings (gear)** icon in the top-right of your AI Studio workspace, and add the following secrets:
                </p>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-slate-700">VITE_STRIPE_PUBLIC_KEY</span>
                      <span className={stripeStatus?.hasPublicKey ? "text-emerald-600 flex items-center gap-0.5 font-semibold" : "text-amber-600 flex items-center gap-0.5 font-semibold"}>
                        {stripeStatus?.hasPublicKey ? "● Configured" : "○ Missing"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-sans">Your Stripe Publishable Key (pk_test_... or pk_live_...)</p>
                  </div>
                  <hr className="border-slate-200" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-slate-700">STRIPE_SECRET_KEY</span>
                      <span className={stripeStatus?.hasSecretKey ? "text-emerald-600 flex items-center gap-0.5 font-semibold" : "text-amber-600 flex items-center gap-0.5 font-semibold"}>
                        {stripeStatus?.hasSecretKey ? "● Configured" : "○ Missing"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-sans">Your Stripe Secret Key (sk_test_... or sk_live_...)</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold font-sans">3</span>
                  Recompile and Try Again
                </h4>
                <p className="text-slate-600 font-sans">
                  After saving, click **Compile Applet** or wait for the system to redeploy.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowStripeGuide(false)}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
