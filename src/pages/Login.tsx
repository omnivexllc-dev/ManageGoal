import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } from '../lib/firebase';
import { ShieldCheck, Mail, Lock, ArrowLeft } from 'lucide-react';

export function Login() {
  const { user, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      await resetPassword(email);
      setIsForgotPassword(false);
    } else if (isSignUp) {
      await signUpWithEmail(email, password);
    } else {
      await loginWithEmail(email, password);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-900 p-4 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col items-center relative">
          <button 
            onClick={() => setIsForgotPassword(false)}
            className="absolute left-8 top-8 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mt-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
          <p className="text-slate-500 text-center mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 mt-4"
            >
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-900 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">ManageGoal CRM</h1>
        <p className="text-slate-500 text-center mb-8">
          A premium, AI-powered CRM for modern businesses. Sign in to access your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors font-medium"
                placeholder="name@company.com"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-slate-700">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors font-medium"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>
        
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full bg-white text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 shadow-sm border border-slate-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-8 text-sm text-slate-500 font-medium">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 font-bold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
