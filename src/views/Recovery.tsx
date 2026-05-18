import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Smile, 
  Frown, 
  Meh,
  Wind,
  Bird,
  Cloud,
  Check,
  ChevronRight,
  Mic,
  Volume2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateSupportMessage } from '../lib/gemini';
import { Language, UserPreferences } from '../types';
import { translations } from '../translations';

interface RecoveryProps {
  language: Language;
  prefs: UserPreferences;
  onPrefsChange: (prefs: Partial<UserPreferences>) => void;
}

export function Recovery({ language, prefs, onPrefsChange }: RecoveryProps) {
  const t = translations[language];
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleLog = async () => {
    if (mood === null) return;
    setLoading(true);
    const msg = await generateSupportMessage(mood, note);
    setSupportMessage(msg);
    setLoading(false);
  };

  const simulatePostToWhatsapp = () => {
    alert("Simulation: Your recovery message has been synced to your private WhatsApp follow-up line.");
  };

  const simulateVoiceSpeak = () => {
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  return (
    <div className="px-6 pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.recovery}</h2>
        <p className="text-slate-500">A dedicated heart-space for your healing journey.</p>
      </div>

      {!supportMessage ? (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-8"
        >
          <Card className="p-10 border-none bg-slate-900 text-white rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(15,76,129,0.3)] relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-black tracking-tight">How are you heart-today?</h3>
                  <button 
                    onClick={simulateVoiceSpeak}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-secondary text-white' : 'bg-white/10 text-white/40'}`}
                  >
                    <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                  </button>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed italic">"Take a deep breath. Your body and heart deserve space to heal today."</p>
                
                <div className="flex justify-between items-center mb-10">
                  {[
                    { v: 1, icon: Frown },
                    { v: 2, icon: Meh },
                    { v: 3, icon: Smile },
                    { v: 4, icon: Heart },
                    { v: 5, icon: Sparkles }
                  ].map(m => (
                    <button
                      key={m.v}
                      onClick={() => setMood(m.v)}
                      className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all shadow-lg ${
                        mood === m.v 
                          ? 'bg-secondary text-white scale-110 shadow-secondary/40 ring-4 ring-secondary/20' 
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                      }`}
                    >
                      <m.icon size={28} />
                    </button>
                  ))}
                </div>

                <div className="bg-white/5 rounded-[2rem] p-6 mb-8 border border-white/10 focus-within:border-secondary/40 transition-colors">
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-secondary mb-4">Current Phase: Early Recovery</p>
                  <textarea
                    placeholder="Share a private thought or feeling..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none placeholder:text-white/20 min-h-[120px] font-medium resize-none"
                  />
                </div>

                <Button 
                  onClick={handleLog}
                  disabled={mood === null || loading}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 font-black transition-all shadow-xl shadow-black/20 text-lg uppercase tracking-wider"
                >
                  {loading ? 'Processing...' : 'Log Daily Reflection'}
                </Button>
             </div>
             
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Wind size={180} strokeWidth={1} />
             </div>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <button className="p-6 bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <Bird size={24} />
               </div>
               <span className="text-xs font-black text-slate-800 uppercase tracking-widest leading-tight">Coping<br/>Resources</span>
            </button>
            <button className="p-6 bg-white rounded-[2rem] border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
                  <Cloud size={24} />
               </div>
               <span className="text-xs font-black text-slate-800 uppercase tracking-widest leading-tight">Healing<br/>Meditation</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-6"
        >
          <Card className="p-10 border-none bg-emerald-50 rounded-[3rem] relative shadow-lg overflow-hidden">
             <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-emerald-500 mb-8 shadow-xl shadow-emerald-900/10">
                   <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-6 tracking-tight">CareBridge Support</h3>
                <p className="text-emerald-800/80 leading-relaxed italic text-xl mb-12 font-medium">
                  "{supportMessage}"
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    className="rounded-2xl bg-emerald-600 text-white h-14 font-black hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm shadow-xl shadow-emerald-200"
                    onClick={() => { setSupportMessage(null); setMood(null); setNote(''); }}
                  >
                    Done for Today
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-emerald-600/60 font-bold text-xs uppercase"
                  >
                    Share with Counselor
                  </Button>
                </div>
             </div>
             
             {/* Abstract organic shape */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </Card>
        </motion.div>
      )}

      <div className="mt-12 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Community Support</h4>
        <div className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                 <Heart size={24} />
              </div>
              <div>
                 <h5 className="font-bold text-slate-900">Healing Together</h5>
                 <p className="text-xs text-slate-500">Private African grief support group</p>
              </div>
           </div>
           <ChevronRight className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}

