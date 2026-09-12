import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { Minda2Logo } from './Minda2Logo';

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (role: "admin" | "student", user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    let authPayload: { role: "admin" | "student"; user: any } | null = null;

    try {
      const res = await axios.post('/api/login/', { email: email.trim(), password: password.trim() });
      authPayload = { role: res.data.role, user: res.data.user };
    } catch (err: any) {
      console.error("Login request error:", err);
      const serverMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' && err.response.data.length < 200 ? err.response.data : null);

      if (err.response?.status === 502 || err.response?.status === 504 || (err.message && err.message.includes("502"))) {
        setError("Cloud server is currently waking up from sleep mode (Render Free Tier). Please wait 10 seconds and click Sign In again!");
      } else if (serverMsg) {
        setError(serverMsg);
      } else if (err.message) {
        setError(`Login failed: ${err.message}`);
      } else {
        setError("Unable to connect to server. Please check your network connection.");
      }
      setIsLoading(false);
      return;
    }

    if (authPayload) {
      try {
        onLoginSuccess(authPayload.role, authPayload.user);
      } catch (uiErr: any) {
        console.error("Error setting session after login:", uiErr);
        setError("Error loading dashboard session. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[420px] bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Gradient header strip */}
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500"></div>
        
        {/* Header */}
        <div className="px-8 pt-8 pb-2 flex flex-col items-center text-center">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-4">
            <Minda2Logo size="md" showTagline={false} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome Back</h2>
          <p className="text-sm text-slate-400 font-medium">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pt-4 pb-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl flex items-start gap-2.5 text-sm font-bold border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Email / Username</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-sky-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:bg-white focus:ring-0 focus:border-sky-500 outline-none transition-all duration-200"
                placeholder="you@college.edu"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-sky-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold text-sm focus:bg-white focus:ring-0 focus:border-sky-500 outline-none transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:from-sky-300 disabled:to-indigo-300 text-white font-black rounded-2xl shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-200 flex items-center justify-center gap-2.5 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>

          {/* Forgot Password */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowForgotInfo(!showForgotInfo)}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-sky-600 transition flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Forgot your password?
            </button>

            {showForgotInfo && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                  Please contact your <span className="font-black">Workshop Admin</span> to reset your password. 
                  They can update it from the Batch Management panel.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
