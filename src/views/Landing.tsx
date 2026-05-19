import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Shield, 
  Users, 
  Sparkles, 
  MapIcon as MapIcon, 
  ArrowRight,
  Plus,
  AlertTriangle,
  Activity,
  HeartPulse,
  Info,
  Stethoscope,
  MapPin,
  Heart,
  Brain,
  Wind,
  Bird,
  Cloud,
  Mic,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppView, Language, UserPreferences } from '../types';
import { translations } from '../translations';

interface LandingProps {
  onStart: () => void;
  onClinicSearch: () => void;
  language: Language;
  prefs: UserPreferences;
  onPrefsChange: (prefs: Partial<UserPreferences>) => void;
}

export function Landing({ onStart, onClinicSearch, language, prefs, onPrefsChange }: LandingProps) {
  const t = translations[language];
  const [showEmergency, setShowEmergency] = React.useState(false);

  const symptomChips = [
    { label: t.quickSymptom === 'Àmì Àìsàn Kíákíá' ? 'Ìsun ẹ̀jẹ̀' : 'Bleeding', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
    { label: 'Severe Cramps', icon: Activity, color: 'text-orange-500 bg-orange-50' },
    { label: 'Fever', icon: HeartPulse, color: 'text-primary bg-primary/10' },
    { label: 'Dizziness', icon: Info, color: 'text-secondary bg-secondary/10' },
    { label: 'High BP', icon: Stethoscope, color: 'text-blue-500 bg-blue-50' },
  ];

  return (
    <div className="flex flex-col gap-10 pb-40 px-4 sm:px-6">
      {/* Greeting & Header */}
      <section>
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex items-center gap-4 mb-2"
        >
           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden ring-4 ring-slate-50">
              <img 
                src="https://images.unsplash.com/photo-1590642916589-592bca10dfbf?auto=format&fit=crop&q=80&w=200&h=200" 
                alt="Healthcare Professional"
                className="w-full h-full object-cover"
              />
           </div>
           <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t.welcome}</p>
              <h2 className="text-xl font-black text-slate-800">{t.greeting}</h2>
           </div>
        </motion.div>
        <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
          "{t.hero}"
        </p>
      </section>

      {/* Main AI Assessment Card */}
      <section>
        <Card className="p-8 border-none bg-[#0F4C81] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <Brain className="text-white" size={24} />
              </div>
              <button 
                onClick={() => onPrefsChange({ voiceGuided: !prefs.voiceGuided })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  prefs.voiceGuided ? 'bg-secondary text-white' : 'bg-white/10 text-white/60'
                }`}
              >
                <Mic size={12} className={prefs.voiceGuided ? 'animate-pulse' : ''} />
                {t.voiceAssistant}
              </button>
            </div>
            <h3 className="text-2xl font-black mb-3 tracking-tight">{t.aiTriage}</h3>
            <p className="text-blue-100/70 text-sm mb-8 leading-relaxed font-medium">
              {t.triageDesc}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onStart}
                className="w-full h-14 rounded-2xl bg-white text-[#0F4C81] hover:bg-blue-50 font-bold text-lg shadow-xl shadow-blue-900/40 gap-2"
              >
                {t.startAssessment}
                <ChevronRight size={20} />
              </Button>
              <Button 
                variant="ghost" 
                className="text-white/60 hover:text-white hover:bg-white/10 uppercase tracking-[0.2em] text-[10px] font-black h-8"
              >
                {t.medicallyVerified}
              </Button>
            </div>
          </div>
          {/* Decorative background pulse */}
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <HeartPulse size={120} strokeWidth={1} />
          </div>
        </Card>
      </section>

      {/* Emergency Quick Access */}
      <section>
        <Button 
          variant="destructive"
          onClick={() => setShowEmergency(true)}
          className="w-full h-16 rounded-3xl bg-rose-50 border-2 border-rose-100 text-rose-500 font-black uppercase tracking-widest text-sm hover:bg-rose-100 transition-all flex items-center justify-between px-8 group"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="group-hover:scale-125 transition-transform" />
            {t.emergency} SOS
          </div>
          <ArrowRight size={20} />
        </Button>
      </section>

      {/* WhatsApp Follow-up Setup */}
      <section>
        <Card className="p-6 border-slate-100 rounded-[2rem] bg-slate-50/50 border relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
              <MessageSquare size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">{t.whatsappSetup}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.active}</p>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.whatsappEnabled} 
              onChange={() => onPrefsChange({ whatsappEnabled: !prefs.whatsappEnabled })}
              className="w-10 h-6 bg-slate-200 checked:bg-emerald-500 appearance-none rounded-full relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all shadow-inner"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {t.whatsappDesc}
          </p>
        </Card>
      </section>

      {/* Quick Symptom Chips */}
      <section>
        <div className="flex justify-between items-center mb-4 ml-1">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t.quickSymptom}</h4>
          <Volume2 size={14} className="text-slate-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          {symptomChips.map((chip, i) => (
            <motion.button
              key={chip.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={onStart}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs border border-transparent hover:border-slate-200 transition-all shadow-sm ${chip.color}`}
            >
              <chip.icon size={14} />
              {chip.label}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Emergency Modal Overlay */}
      <AnimatePresence>
        {showEmergency && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmergency(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-3xl text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-8 ring-8 ring-rose-50/50">
                <AlertTriangle size={40} className="animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{t.emergencyEscalation}</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                {t.notifyingClinic}
              </p>
              
              <div className="space-y-3">
                <Button 
                  className="w-full h-14 rounded-2xl bg-[#0F4C81] text-white font-bold text-lg"
                  onClick={() => {
                    alert("Emergency call initiated...");
                    setShowEmergency(false);
                  }}
                >
                  Confirm Call
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full font-bold text-slate-400"
                  onClick={() => setShowEmergency(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Care & Recovery Previews */}
      <section className="grid grid-cols-1 gap-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Nearby Support</h4>
        
        <Card className="p-5 border-slate-100 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClinicSearch}>
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#2EC4B6]/10 rounded-2xl flex items-center justify-center text-[#2EC4B6] shadow-inner">
                 <MapPin size={28} />
              </div>
              <div>
                 <div className="flex items-center gap-2 mb-0.5">
                    <h5 className="font-black text-slate-800">Lagos Maternal Center</h5>
                    <Badge variant="outline" className="text-[9px] h-4 bg-teal-50 border-teal-100 text-[#2EC4B6]">ACTIVE</Badge>
                 </div>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">1.2 km • Open 24/7</p>
              </div>
           </div>
           <ChevronRight className="text-slate-300" size={20} />
        </Card>

        <Card className="p-5 border-slate-100 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                 <Heart size={28} />
              </div>
              <div>
                 <h5 className="font-black text-slate-800">Emotional Wellness</h5>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Compassionate AI Support</p>
              </div>
           </div>
           <ChevronRight className="text-slate-300" size={20} />
        </Card>
      </section>

      {/* Safety Carousel */}
      <section className="bg-slate-900 mx-[-16px] sm:mx-[-24px] px-6 sm:px-8 py-10 text-white rounded-t-[2.5rem] sm:rounded-t-[3rem]">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Maternal Safety Tips</h4>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
           <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                 <Shield className="text-secondary" size={24} />
              </div>
              <div>
                 <h5 className="font-bold text-lg mb-1 leading-tight">Monitor your iron levels</h5>
                 <p className="text-sm text-white/60 leading-relaxed font-medium capitalize">Iron deficiency can increase pregnancy complications. Consult your doctor for supplements.</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
