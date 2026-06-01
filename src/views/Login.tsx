import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HeartPulse, User, ShieldAlert, KeyRound, Loader2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (session: UserSession) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('Tomi');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'patient' | 'chw'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    setError('');

    // Simulate network authentication delay
    setTimeout(() => {
      setLoading(false);
      onLogin({
        username: username.trim(),
        role: role,
        chwId: role === 'chw' ? 'chw_tomi' : undefined
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 md:px-0 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-[#0F4C81]/10 blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary to-[#0F4C81] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-4">
            <HeartPulse size={30} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            CareBridge <span className="font-extralight text-primary bg-primary/5 px-2.5 py-0.5 rounded-full text-lg align-middle">AI</span>
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">
            Maternal Health Intelligence
          </p>
        </div>

        <Card className="p-8 border border-white/60 bg-white/70 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-2"
              >
                <ShieldAlert size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold text-slate-800 transition-all outline-none"
                  placeholder="Enter name (e.g. Tomi)"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold text-slate-800 transition-all outline-none"
                  placeholder="Password"
                />
              </div>
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Select Portal Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Patient Mode Card */}
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    role === 'patient'
                      ? 'border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81] font-bold shadow-md shadow-blue-50'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === 'patient' ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <User size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Patient</span>
                </button>

                {/* CHW Mode Card */}
                <button
                  type="button"
                  onClick={() => setRole('chw')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    role === 'chw'
                      ? 'border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81] font-bold shadow-md shadow-blue-50'
                      : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === 'chw' ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Sparkles size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Health Worker Portal</span>
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#0F4C81] to-primary hover:opacity-95 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-100"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Accessing Portal...
                </>
              ) : (
                'Access Portal'
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
