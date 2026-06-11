/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'nprogress/nprogress.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { Customers } from './pages/Customers';
import { Tasks } from './pages/Tasks';
import { Automation } from './pages/Automation';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { useAuth } from './hooks/useAuth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-900 font-sans">Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#fff', color: '#0f172a', border: '1px solid #f8fafc', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' } }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
