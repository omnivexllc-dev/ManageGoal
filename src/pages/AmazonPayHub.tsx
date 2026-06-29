import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, doc, updateDoc, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  CreditCard, CheckCircle2, ShieldCheck, HelpCircle, Loader2, Key, 
  Info, ExternalLink, ArrowRight, Play, RefreshCw, Smartphone, Globe, Mail,
  AlertTriangle, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AmazonPayHub() {
  const { user, profile } = useAuth();
  const [keysConfigured, setKeysConfigured] = useState<boolean | null>(null);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);
  const [merchantId, setMerchantId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [publicKeyId, setPublicKeyId] = useState<string>('');
  const [hasPrivateKey, setHasPrivateKey] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Playground State
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Enterprise'>('Pro');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'login' | 'wallet' | 'success'>('login');
  const [mockEmail, setMockEmail] = useState(user?.email || 'customer@example.com');
  const [mockPassword, setMockPassword] = useState('••••••••');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [mockSelectedCard, setMockSelectedCard] = useState('Visa ending in 4321');
  const [mockSelectedAddress, setMockSelectedAddress] = useState('123 Amazon Way, Seattle, WA 98101');

  useEffect(() => {
    // Check if real backend keys are configured
    fetch('/api/amazon-pay/status')
      .then(res => res.json())
      .then(data => {
        setKeysConfigured(data.configured);
        setSandboxMode(data.sandbox);
        setMerchantId(data.merchantId);
        setStoreId(data.storeId);
        setPublicKeyId(data.publicKeyId);
        setHasPrivateKey(data.hasPrivateKey);
        setLoadingStatus(false);
      })
      .catch(() => {
        setKeysConfigured(false);
        setLoadingStatus(false);
      });
  }, []);

  const handleStartSimulatedCheckout = () => {
    setCheckoutStep('login');
    setIsCheckoutOpen(true);
  };

  const handleRealAmazonPayCheckout = async () => {
    setIsRedirecting(true);
    const price = selectedPlan === 'Pro' ? 29 : 99;
    const loadToast = toast.loading('Initiating secure transaction with Amazon Pay...');
    try {
      const response = await fetch('/api/amazon-pay/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, price })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate Amazon Pay session.');
      }
      
      const session = await response.json();
      if (session.webCheckoutDetails && session.webCheckoutDetails.amazonPayRedirectUrl) {
        toast.success('Secure session established. Redirecting...', { id: loadToast });
        window.location.href = session.webCheckoutDetails.amazonPayRedirectUrl;
      } else {
        throw new Error('No redirect URL returned from Amazon Pay.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating Amazon Pay checkout session.', { id: loadToast });
      console.error(err);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleSimulateLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setCheckoutStep('wallet');
    }, 1200);
  };

  const handleSimulatePayment = async () => {
    setIsProcessingPayment(true);
    setTimeout(async () => {
      setIsProcessingPayment(false);
      setCheckoutStep('success');
      
      // Upgrade the user's CRM plan in Firebase!
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            plan: `${selectedPlan} (Amazon Pay)`,
            updatedAt: Date.now()
          });
          toast.success(`Successfully upgraded to ${selectedPlan} via Amazon Pay!`);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    }, 1800);
  };

  const handleResetPlan = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          plan: 'Essential',
          updatedAt: Date.now()
        });
        toast.success('Subscription status reset to Essential.');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-600 font-semibold mb-1">
            <CreditCard size={18} />
            <span>Payment Integrations</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Amazon Pay Gateway</h1>
          <p className="text-slate-500 mt-1">Configure, test, and manage Amazon Pay Checkout v2 transactions directly within your CRM.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {profile?.plan && (
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-sm">
              <span className="text-slate-500 font-medium">Current Plan: </span>
              <span className="text-slate-900 font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-xs ml-1 border border-amber-100">
                {profile.plan}
              </span>
            </div>
          )}
          
          {profile?.plan && profile.plan.includes('Amazon Pay') && (
            <button 
              onClick={handleResetPlan}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl font-semibold transition-colors"
            >
              Reset to Free Plan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: API Configuration Status & Step-by-Step Guide */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Connection Status Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Key size={20} className="text-amber-500" />
              API Credentials Status
            </h2>
            
            {loadingStatus ? (
              <div className="flex items-center gap-3 text-slate-500 p-3 bg-slate-50 rounded-2xl">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-medium">Checking credentials in .env...</span>
              </div>
            ) : keysConfigured ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 flex items-start gap-3">
                  <ShieldCheck size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">
                      Connected & Active ({sandboxMode ? 'Sandbox Testing' : 'Production Live 🔴'})
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Your server is configured with valid Amazon Pay keys. 
                      {sandboxMode 
                        ? " Transactions are running in Sandbox mode. Switch to Live mode for production payments." 
                        : " Real-world LIVE payments are active! Money will be processed from buyer wallets."}
                    </p>
                  </div>
                </div>
                {sandboxMode && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-blue-800 flex items-start gap-3">
                    <Info size={22} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">How to accept live payments</h4>
                      <p className="text-xs text-blue-700 leading-relaxed mt-1">
                        To accept live, production payments, make sure you configure your environment variables with <code className="bg-blue-100/50 px-1 py-0.5 rounded font-mono">AMAZON_PAY_SANDBOX="false"</code>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-800 flex items-start gap-3">
                <Info size={22} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Demo Mode Active (No Keys Setup)</h4>
                  <p className="text-xs text-amber-700 mt-1">To connect live, please set up your Amazon Pay Merchant ID, Store ID, Public Key ID, and Private Key in your environment secrets. Our fully responsive sandbox playground is active for you to test below!</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-400 block mb-1">MERCHANT ID</span>
                <span className="text-sm font-mono text-slate-700 break-all">
                  {keysConfigured ? merchantId || 'amzn1.merchant.••••••••••' : 'Not configured'}
                </span>
              </div>
              <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-400 block mb-1">STORE ID (CLIENT ID)</span>
                <span className="text-sm font-mono text-slate-700 break-all">
                  {keysConfigured ? storeId || 'amzn1.application-oa2-client.••••••••••' : 'Not configured'}
                </span>
              </div>
            </div>
          </div>

          {/* Setup Guide Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle size={20} className="text-blue-500" />
              Amazon Pay Integration Guide
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Create an Amazon Seller Central Account</h4>
                  <p className="text-xs text-slate-500 mt-1">Sign up for an Amazon Seller account and register for Amazon Pay. Make sure to complete the developer onboarding to obtain your Sandbox and Production access.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Generate Public/Private Key Pairs</h4>
                  <p className="text-xs text-slate-500 mt-1">Generate your RSA key pair inside the Amazon Pay Integration Central. Download the private key (.pem file) and copy the Public Key ID generated by Amazon.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Add Secrets to App Variables</h4>
                  <p className="text-xs text-slate-500 mt-1">Configure these variables in your CRM environment settings:</p>
                  <pre className="text-[11px] font-mono bg-slate-900 text-slate-300 p-3 rounded-xl mt-2 overflow-x-auto leading-relaxed">
{`AMAZON_PAY_MERCHANT_ID="amzn1.merchant..."
AMAZON_PAY_STORE_ID="amzn1.application-oa2-client..."
AMAZON_PAY_PUBLIC_KEY_ID="amzn1.pa.key..."
AMAZON_PAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."`}
                  </pre>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Load the Official Amazon SDK Client</h4>
                  <p className="text-xs text-slate-500 mt-1">In your server code, instantiate the WebCheckoutClient to securely communicate with Amazon APIs:</p>
                  <pre className="text-[11px] font-mono bg-slate-900 text-slate-300 p-3 rounded-xl mt-2 overflow-x-auto leading-relaxed">
{`import { WebCheckoutClient } from '@amazonpay/amazon-pay-api-sdk-nodejs';

const client = new WebCheckoutClient({
  publicKeyId: process.env.AMAZON_PAY_PUBLIC_KEY_ID,
  privateKey: process.env.AMAZON_PAY_PRIVATE_KEY,
  region: 'na',
  sandbox: true
});`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Playground / Simulated Checkout */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {keysConfigured ? 'Payment Checkout Gateway' : 'Sandbox Playground'}
                </h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                  keysConfigured 
                    ? sandboxMode 
                      ? 'text-blue-600 bg-blue-50 border-blue-100' 
                      : 'text-rose-600 bg-rose-50 border-rose-100'
                    : 'text-amber-600 bg-amber-50 border-amber-100'
                }`}>
                  {keysConfigured 
                    ? sandboxMode 
                      ? 'Sandbox Mode' 
                      : 'Production Live 🔴'
                    : 'Interactive Demo'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {keysConfigured 
                  ? `Choose a subscription tier below and complete your upgrade securely using the ${sandboxMode ? 'Sandbox' : 'Production Live'} Amazon Pay gateway.`
                  : 'Choose a subscription tier below and test the checkout flow using our interactive, step-by-step simulator representing official Amazon Pay v2 standards.'}
              </p>
              
              {/* Plan Picker */}
              <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                  onClick={() => setSelectedPlan('Pro')}
                  className={`py-3 rounded-xl text-xs font-bold transition-all ${
                    selectedPlan === 'Pro' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pro Plan ($29/mo)
                </button>
                <button
                  onClick={() => setSelectedPlan('Enterprise')}
                  className={`py-3 rounded-xl text-xs font-bold transition-all ${
                    selectedPlan === 'Enterprise' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Enterprise Plan ($99/mo)
                </button>
              </div>

              {/* Package Details Box */}
              <div className="border border-slate-100 rounded-2xl p-4 mb-6 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Checkout Details</h4>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Product</span>
                  <span className="text-slate-900 font-bold">ManageGoal CRM - {selectedPlan}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Frequency</span>
                  <span className="text-slate-900 font-medium">Monthly billing</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-2.5 mt-2">
                  <span className="text-slate-900 font-bold">Amount Due</span>
                  <span className="text-lg font-extrabold text-blue-600">${selectedPlan === 'Pro' ? '29.00' : '99.00'}</span>
                </div>
              </div>
            </div>

            {/* Gold Amazon Pay Button */}
            <div>
              {keysConfigured ? (
                <button
                  onClick={handleRealAmazonPayCheckout}
                  disabled={isRedirecting}
                  className="w-full h-12 bg-[#FF9900] hover:bg-[#E58A00] disabled:opacity-75 text-slate-950 font-bold rounded-full shadow-md transition-all flex items-center justify-center gap-3 relative overflow-hidden group border border-amber-500"
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 py-1 px-3 bg-white/20 rounded-full text-xs tracking-wider">
                        <span className="font-extrabold text-slate-950 italic">amazon</span>
                        <span className="font-normal text-slate-950">pay</span>
                      </div>
                      <span className="text-sm tracking-wide">
                        Pay with Amazon Pay
                      </span>
                      <ArrowRight size={16} className="text-slate-950 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStartSimulatedCheckout}
                  className="w-full h-12 bg-[#FF9900] hover:bg-[#E58A00] text-slate-950 font-bold rounded-full shadow-md transition-all flex items-center justify-center gap-3 relative overflow-hidden group border border-amber-500"
                >
                  <div className="flex items-center gap-1.5 py-1 px-3 bg-white/20 rounded-full text-xs tracking-wider">
                    <span className="font-extrabold text-slate-950 italic">amazon</span>
                    <span className="font-normal text-slate-950">pay</span>
                  </div>
                  <span className="text-sm tracking-wide">Subscribe Now</span>
                  <ArrowRight size={16} className="text-slate-950 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
              
              {keysConfigured && (
                <div className="text-center mt-3">
                  <button 
                    onClick={handleStartSimulatedCheckout}
                    className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold transition-colors"
                  >
                    Want to test offline? Try the interactive mock simulator instead
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-400 font-medium">
                <ShieldCheck size={12} className="text-slate-400" />
                <span>Secure payment option backed by Amazon Pay standards</span>
              </div>
            </div>

          </div>
          
        </div>

      </div>

      {/* Simulator Modal Box */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="bg-[#FF9900] text-slate-950 px-2.5 py-0.5 rounded text-xs font-black italic tracking-wide">
                  amazon pay
                </div>
                <span className="text-xs font-semibold text-slate-400">Sandbox Merchant Account</span>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white font-medium text-sm px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* STEP 1: LOGIN */}
            {checkoutStep === 'login' && (
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900">Sign in with Amazon</h3>
                  <p className="text-xs text-slate-500 mt-1">To process sandbox transaction for ManageGoal CRM</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Email (phone for mobile accounts)</label>
                    <input 
                      type="email" 
                      value={mockEmail}
                      onChange={(e) => setMockEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
                    <input 
                      type="password" 
                      value={mockPassword}
                      onChange={(e) => setMockPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSimulateLogin}
                  disabled={isLoggingIn}
                  className="w-full h-11 bg-[#FF9900] hover:bg-[#E58A00] text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Connecting to Amazon...</span>
                    </>
                  ) : (
                    <span className="text-sm">Sign In</span>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: ADDRESS AND WALLET WIDGETS */}
            {checkoutStep === 'wallet' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select payment & address details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Please confirm your shipping address and payment card.</p>
                </div>

                {/* Simulated Address Widget */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address Book</span>
                    <button className="text-[10px] text-amber-600 hover:underline font-bold">Add new address</button>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <input type="radio" defaultChecked className="mt-1 text-amber-600 focus:ring-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">John Doe (Mock User)</p>
                      <p className="text-xs text-slate-500 mt-0.5">{mockSelectedAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Wallet Widget */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amazon Wallet</span>
                    <button className="text-[10px] text-amber-600 hover:underline font-bold">Add new card</button>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="card" 
                        checked={mockSelectedCard === 'Visa ending in 4321'} 
                        onChange={() => setMockSelectedCard('Visa ending in 4321')}
                        className="text-amber-600 focus:ring-amber-500" 
                      />
                      <span className="text-xs font-semibold text-slate-700">Visa ending in 4321 <span className="text-[10px] text-slate-400 ml-1">(Default)</span></span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="card" 
                        checked={mockSelectedCard === 'Mastercard ending in 8765'} 
                        onChange={() => setMockSelectedCard('Mastercard ending in 8765')}
                        className="text-amber-600 focus:ring-amber-500" 
                      />
                      <span className="text-xs font-semibold text-slate-700">Mastercard ending in 8765</span>
                    </label>
                  </div>
                </div>

                {/* Charge Review Details */}
                <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>ManageGoal {selectedPlan} Plan:</span>
                    <span>${selectedPlan === 'Pro' ? '29.00' : '99.00'} / mo</span>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-relaxed pt-1">By clicking "Confirm Order" you authorize Amazon Pay to securely process your subscription billing for ManageGoal CRM.</p>
                </div>

                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessingPayment}
                  className="w-full h-11 bg-[#FF9900] hover:bg-[#E58A00] text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-sm">Authorizing with Amazon Pay...</span>
                    </>
                  ) : (
                    <span className="text-sm">Confirm Order & Pay</span>
                  )}
                </button>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {checkoutStep === 'success' && (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 size={36} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Subscription Authorized!</h3>
                  <p className="text-xs text-slate-500 mt-1">Amazon Pay checkout transaction processed successfully.</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 text-left max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Merchant</span>
                    <span className="text-slate-800 font-bold">ManageGoal CRM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Plan Activated</span>
                    <span className="text-slate-800 font-bold">{selectedPlan} Subscription</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Payment Source</span>
                    <span className="text-slate-800 font-bold">{mockSelectedCard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Transaction ID</span>
                    <span className="text-slate-800 font-mono font-medium">ap-tx_89f0a8c2d8294a0e1b2c</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
                >
                  Return to CRM
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
