import React, { useState, useEffect } from 'react';
import { Lock, Loader2, ShieldX, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminGate({ onGranted }) {
  const [step, setStep] = useState('checking'); // checking | login-required | not-admin | verified
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setStep('checking');
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.role === 'admin') {
        setStep('verified');
        onGranted();
      } else {
        setStep('not-admin');
      }
    } catch {
      setStep('login-required');
    }
  };

  if (step === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (step === 'login-required') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 font-sans font-bold">
        <div className="bg-white p-14 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-gray-100 text-center space-y-8 animate-in zoom-in-95">
          <div className="bg-teal-50 p-6 rounded-3xl inline-block border border-teal-100 shadow-inner">
            <Lock className="w-10 h-10 text-teal-800" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Admin Access</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest tracking-[0.2em]">Sign in to continue</p>
          </div>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (step === 'not-admin') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6 font-sans font-bold">
        <div className="bg-white p-14 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-gray-100 text-center space-y-8 animate-in zoom-in-95">
          <div className="bg-red-50 p-6 rounded-3xl inline-block border border-red-100 shadow-inner">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Access Denied</h2>
            <p className="text-xs text-gray-500 font-medium normal-case tracking-normal">
              Your account (<span className="font-bold text-slate-700">{user?.email}</span>) does not have admin privileges.
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Contact your administrator to request access.</p>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="w-full bg-red-600 text-white p-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // step === 'verified' — onGranted already called, render nothing
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
      <ShieldCheck className="w-8 h-8 text-teal-600" />
    </div>
  );
}