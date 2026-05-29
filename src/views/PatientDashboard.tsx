import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Heart, 
  ChevronRight, 
  MapPin, 
  Activity, 
  HeartPulse, 
  Info, 
  Stethoscope, 
  AlertTriangle, 
  Brain, 
  Mic, 
  MessageSquare, 
  Volume2, 
  Droplets,
  LogOut,
  Calendar,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Language, UserPreferences, UserSession } from '../types';
import { translations } from '../translations';

interface PatientDashboardProps {
  onStart: () => void;
  onClinicSearch: () => void;
  language: Language;
  prefs: UserPreferences;
  onPrefsChange: (prefs: Partial<UserPreferences>) => void;
  session: UserSession;
  onSignOut: () => void;
}

export function PatientDashboard({ 
  onStart, 
  onClinicSearch, 
  language, 
  prefs, 
  onPrefsChange, 
  session, 
  onSignOut 
}: PatientDashboardProps) {
  const t = translations[language];
  const [showEmergency, setShowEmergency] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(3);
  const [mealEaten, setMealEaten] = useState(false);
  const [medTaken, setMedTaken] = useState(false);
  const [streak, setStreak] = useState(4);

  const symptomChips = [
    { label: language === 'yo' ? 'Ìsun ẹ̀jẹ̀' : 'Bleeding', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
    { label: 'Severe Cramps', icon: Activity, color: 'text-orange-500 bg-orange-50' },
    { label: 'Fever', icon: HeartPulse, color: 'text-primary bg-primary/10' },
    { label: 'Dizziness', icon: Info, color: 'text-secondary bg-secondary/10' },
    { label: 'High BP', icon: Stethoscope, color: 'text-blue-500 bg-blue-50' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-40 px-4 sm:px-6">
      {/* Patient Greeting & Sign-Out */}
      <section className="flex justify-between items-center bg-white/40 p-4 rounded-3xl border border-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden ring-4 ring-slate-50">
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200" 
              alt="User profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Patient Portal</p>
            <h2 className="text-lg font-black text-slate-800">Hello, {session.username}</h2>
          </div>
        </div>

        <button 
          onClick={onSignOut}
          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </section>

      {/* Recovery Streak & Vitals Tracker */}
      <section>
        <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm flex flex-col gap-5 border">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Daily Recovery Checklist</h4>
            <Badge className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
              Streak: {streak} Days
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Water Tracker */}
            <button 
              onClick={() => {
                setWaterGlasses(p => Math.min(10, p + 1));
                if (waterGlasses === 7) setStreak(s => s + 1);
              }}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 text-center flex flex-col items-center gap-1.5 transition-all"
            >
              <Droplets className="text-blue-500" size={20} />
              <span className="text-[9px] font-black text-slate-400 uppercase">Hydrate</span>
              <span className="text-xs font-extrabold text-slate-800">{waterGlasses}/8 Glasses</span>
            </button>

            {/* Meal Eaten */}
            <button 
              onClick={() => setMealEaten(p => !p)}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                mealEaten ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
              }`}
            >
              <ClipboardList className={mealEaten ? 'text-emerald-500' : 'text-slate-400'} size={20} />
              <span className="text-[9px] font-black text-slate-400 uppercase">Nutrition</span>
              <span className="text-xs font-extrabold text-slate-800">{mealEaten ? 'Completed' : 'Tap to log'}</span>
            </button>

            {/* Med Tracker */}
            <button 
              onClick={() => setMedTaken(p => !p)}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                medTaken ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
              }`}
            >
              <Heart className={medTaken ? 'text-rose-500' : 'text-slate-400'} size={20} />
              <span className="text-[9px] font-black text-slate-400 uppercase">Medication</span>
              <span className="text-xs font-extrabold text-slate-800">{medTaken ? 'Taken' : 'Tap to log'}</span>
            </button>
          </div>
        </Card>
      </section>

      {/* Main AI Assessment Card */}
      <section>
        <Card className="p-6 border-none bg-gradient-to-tr from-[#0F4C81] to-[#1e619c] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <Brain className="text-white animate-pulse" size={24} />
              </div>
              <button 
                onClick={() => onPrefsChange({ voiceGuided: !prefs.voiceGuided })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  prefs.voiceGuided ? 'bg-secondary text-white' : 'bg-white/10 text-white/60'
                }`}
              >
                <Mic size={12} className={prefs.voiceGuided ? 'animate-pulse' : ''} />
                {t.voiceAssistant || 'Voice Guide'}
              </button>
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">Post-Loss Recovery Triage</h3>
            <p className="text-blue-100/70 text-xs mb-6 leading-relaxed font-medium">
              Start our clinically audited AI assessment to analyze recovery risk levels, identify immediate care gaps, and secure clinical guidance.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={onStart}
                className="w-full h-12 rounded-2xl bg-white text-[#0F4C81] hover:bg-blue-50 font-black uppercase tracking-wider text-xs shadow-xl shadow-blue-900/20 gap-2"
              >
                Start Recovery Test
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          {/* Decorative background pulse */}
          <div className="absolute -bottom-6 -right-6 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none text-white">
            <HeartPulse size={160} strokeWidth={1} />
          </div>
        </Card>
      </section>

      {/* Emergency Quick Access */}
      <section>
        <Button 
          variant="destructive"
          onClick={() => setShowEmergency(true)}
          className="w-full h-14 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-100 transition-all flex items-center justify-between px-6 group"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="group-hover:scale-125 transition-transform" />
            Emergency SOS Dispatch
          </div>
          <ChevronRight size={20} />
        </Button>
      </section>

      {/* WhatsApp Follow-up Setup */}
      <section>
        <Card className="p-5 border-slate-100 rounded-[2rem] bg-slate-50/50 border relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
              <MessageSquare size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-sm text-slate-800">{t.whatsappSetup || 'WhatsApp Follow-ups'}</h4>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Follow-up Mode</p>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.whatsappEnabled} 
              onChange={() => onPrefsChange({ whatsappEnabled: !prefs.whatsappEnabled })}
              className="w-10 h-6 bg-slate-200 checked:bg-emerald-500 appearance-none rounded-full relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all shadow-inner"
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {t.whatsappDesc || 'Receive weekly symptom recovery checklists and follow-up support directly through your WhatsApp account.'}
          </p>
        </Card>
      </section>

      {/* Quick Symptom Chips */}
      <section>
        <div className="flex justify-between items-center mb-4 ml-1">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Quick Risk Triggers</h4>
          <Volume2 size={14} className="text-slate-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          {symptomChips.map((chip) => (
            <button
              key={chip.label}
              onClick={onStart}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs border border-transparent hover:border-slate-200 transition-all shadow-sm ${chip.color}`}
            >
              <chip.icon size={14} />
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* Nearby Support */}
      <section className="flex flex-col gap-3">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 ml-1">Nearby Support Clinics</h4>
        
        <Card className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all border cursor-pointer bg-white" onClick={onClinicSearch}>
           <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#2EC4B6]/10 rounded-xl flex items-center justify-center text-[#2EC4B6] shadow-inner shrink-0">
                 <MapPin size={22} />
              </div>
              <div>
                 <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <h5 className="font-extrabold text-sm text-slate-800">Lagos Maternal Center</h5>
                    <Badge variant="outline" className="text-[8px] h-3.5 bg-teal-50 border-teal-100 text-[#2EC4B6]">ACTIVE</Badge>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">1.2 km • Open 24/7</p>
              </div>
           </div>
           <ChevronRight className="text-slate-300" size={16} />
        </Card>
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
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-3xl text-center z-10"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6 ring-8 ring-rose-50/50">
                <AlertTriangle size={32} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3 tracking-tight">{t.emergencyEscalation || 'Emergency Dispatch'}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                {t.notifyingClinic || 'Notifying nearest clinical team of emergency escalation. Standard dispatch protocols will start.'}
              </p>
              
              <div className="space-y-2">
                <Button 
                  className="w-full h-12 rounded-xl bg-[#0F4C81] text-white font-bold text-base"
                  onClick={() => {
                    alert("Emergency call initiated...");
                    setShowEmergency(false);
                  }}
                >
                  Confirm Emergency Call
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
    </div>
  );
}
