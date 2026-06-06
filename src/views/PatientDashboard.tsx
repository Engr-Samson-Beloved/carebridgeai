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
  Globe,
  ClipboardList,
  Calendar,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { Language, UserPreferences, UserSession, ALL_LANGUAGES } from '../types';
import { translations } from '../translations';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { generateSupportMessage } from '../lib/gemini';

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
  const t = translations[language] || translations['en'];
  const [showEmergency, setShowEmergency] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(3);
  const [mealEaten, setMealEaten] = useState(false);
  const [medTaken, setMedTaken] = useState(false);
  const [streak, setStreak] = useState(4);

  const [mood, setMood] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [moodLoggedToday, setMoodLoggedToday] = useState(() => {
    const lastLoggedDate = localStorage.getItem('carebridge_mood_logged_date');
    const todayStr = new Date().toISOString().split('T')[0];
    return lastLoggedDate === todayStr;
  });

  React.useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLoggedDate = localStorage.getItem('carebridge_mood_logged_date');
    if (lastLoggedDate === todayStr) {
      const storedMsg = localStorage.getItem('carebridge_mood_support_msg');
      const storedMood = localStorage.getItem('carebridge_mood_value');
      if (storedMsg) setSupportMessage(storedMsg);
      if (storedMood) setMood(Number(storedMood));
    }
  }, []);

  const handleMoodSubmit = async (selectedMood: number) => {
    setLoading(true);
    setMood(selectedMood);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const msg = await generateSupportMessage(selectedMood, "Logged from home dashboard quick check-in");
    setSupportMessage(msg);
    localStorage.setItem('carebridge_mood_support_msg', msg);
    localStorage.setItem('carebridge_mood_value', String(selectedMood));
    localStorage.setItem('carebridge_mood_logged_date', todayStr);
    setMoodLoggedToday(true);
    setShowMoodModal(true);

    setStreak(prev => prev + 1);

    try {
      await addDoc(collection(db, 'symptom_logs'), {
        patientName: session.username,
        timestamp: new Date().toISOString(),
        mood: selectedMood,
        note: "Logged from home dashboard quick check-in",
        tags: ["Emotional Checkout"]
      });
    } catch (err) {
      console.warn("Offline or Firestore log failed:", err);
    }
    setLoading(false);
  };

  const [activeLangs, setActiveLangs] = useState<string[]>(() => {
    const saved = localStorage.getItem('carebridge_active_langs');
    return saved ? JSON.parse(saved) : ['en', 'fr', 'sw', 'yo', 'ha'];
  });
  const [langQuery, setLangQuery] = useState('');

  const handleAddLanguage = (code: string) => {
    if (!activeLangs.includes(code)) {
      const updated = [...activeLangs, code];
      setActiveLangs(updated);
      localStorage.setItem('carebridge_active_langs', JSON.stringify(updated));
    }
    onPrefsChange({ language: code });
    setShowLangMenu(false);
    setLangQuery('');
  };

  React.useEffect(() => {
    const handleCareBridgeAction = (e: Event) => {
      const { type, data } = (e as CustomEvent).detail;
      if (type === 'LOG_WATER') {
        const increment = data?.amount || 1;
        setWaterGlasses(prev => {
          const next = Math.min(10, prev + increment);
          if (prev < 8 && next >= 8) {
            setStreak(s => s + 1);
          }
          return next;
        });
      } else if (type === 'LOG_NUTRITION') {
        setMealEaten(true);
      } else if (type === 'LOG_MEDICINE') {
        setMedTaken(true);
      }
    };

    window.addEventListener('carebridge-action', handleCareBridgeAction);
    return () => {
      window.removeEventListener('carebridge-action', handleCareBridgeAction);
    };
  }, []);

  // Appointments Tracking State
  const [appointments, setAppointments] = useState<any[]>(() => {
    const saved = localStorage.getItem('carebridge_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse appointments", e);
      }
    }
    // Default initial appointment for testing Okeya's scenario: Thursday antenatal visit
    return [
      {
        id: 'default-antenatal',
        type: 'Antenatal Visit',
        recurrence: 'weekly',
        dayOfWeek: 4, // Thursday
        time: '09:00',
        notes: 'Bring pregnancy registration folder and a water bottle.'
      }
    ];
  });

  const [showAddAppt, setShowAddAppt] = useState(false);
  const [isApptsExpanded, setIsApptsExpanded] = useState(false);
  const [newType, setNewType] = useState('Antenatal Visit');
  const [newRecur, setNewRecur] = useState('weekly');
  const [newDay, setNewDay] = useState(4); // Thursday (keep for legacy compatibility if needed)
  const [newDays, setNewDays] = useState<number[]>([4]); // Selected days array (default Thursday)
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newNotes, setNewNotes] = useState('');

  const saveAppointments = (newAppts: any[]) => {
    setAppointments(newAppts);
    localStorage.setItem('carebridge_appointments', JSON.stringify(newAppts));
  };

  const handleAddAppt = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecur === 'none' && !newDate) {
      alert("Please select a date.");
      return;
    }
    if (newRecur === 'weekly' && newDays.length === 0) {
      alert("Please select at least one day.");
      return;
    }
    
    const newAppt = {
      id: `appt-${Date.now()}`,
      type: newType,
      recurrence: newRecur,
      dayOfWeek: newRecur === 'weekly' ? newDays[0] : null,
      daysOfWeek: newRecur === 'weekly' ? newDays : null,
      date: newRecur === 'none' ? newDate : null,
      time: newTime,
      notes: newNotes
    };
    
    saveAppointments([...appointments, newAppt]);
    setShowAddAppt(false);
    setNewNotes('');
    setNewDays([4]); // Reset to Thursday default
  };

  const handleDeleteAppt = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment tracking?")) {
      saveAppointments(appointments.filter(a => a.id !== id));
    }
  };

  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  const getAppointmentReminder = (appt: any) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (appt.recurrence === 'weekly') {
      const days: number[] = Array.isArray(appt.daysOfWeek) 
        ? appt.daysOfWeek 
        : (appt.dayOfWeek !== null && appt.dayOfWeek !== undefined ? [Number(appt.dayOfWeek)] : []);
      
      if (days.length === 0) return null;

      const currentDay = today.getDay();
      
      // Calculate diffs for each day
      const diffs = days.map(d => ({
        day: d,
        diff: (d - currentDay + 7) % 7
      }));

      // Sort so that today (0) or tomorrow (1) or closest next day is first
      diffs.sort((a, b) => a.diff - b.diff);

      const closest = diffs[0];

      if (closest.diff === 0) {
        return {
          status: 'today',
          message: `Your recurring ${appt.type} is TODAY! ${appt.notes || 'Remember to pack your card and keep hydrated.'}`
        };
      } else if (closest.diff === 1) {
        return {
          status: 'tomorrow',
          message: `Reminder: Your recurring ${appt.type} is TOMORROW (${getDayName(closest.day)})! ${appt.notes || 'Remember to pack your card and prepare your questions.'}`
        };
      } else {
        return {
          status: 'upcoming',
          message: `Next recurring ${appt.type} is next ${getDayName(closest.day)}. ${appt.notes || ''}`
        };
      }
    } else {
      const apptDate = new Date(appt.date);
      apptDate.setHours(0,0,0,0);
      
      const timeDiff = apptDate.getTime() - today.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (dayDiff === 0) {
        return {
          status: 'today',
          message: `Your scheduled ${appt.type} is TODAY at ${appt.time || 'your scheduled time'}! ${appt.notes || ''}`
        };
      } else if (dayDiff === 1) {
        return {
          status: 'tomorrow',
          message: `Reminder: Your scheduled ${appt.type} is TOMORROW at ${appt.time || 'your scheduled time'}! ${appt.notes || ''}`
        };
      } else if (dayDiff > 1 && dayDiff <= 7) {
        return {
          status: 'upcoming',
          message: `Upcoming ${appt.type} in ${dayDiff} days (${appt.date} at ${appt.time || ''}). ${appt.notes || ''}`
        };
      }
    }
    return null;
  };

  const symptomChips = [
    { label: language === 'yo' ? 'Ìsun ẹ̀jẹ̀' : 'Bleeding', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
    { label: 'Severe Cramps', icon: Activity, color: 'text-orange-500 bg-orange-50' },
    { label: 'Fever', icon: HeartPulse, color: 'text-primary bg-primary/10' },
    { label: 'Dizziness', icon: Info, color: 'text-secondary bg-secondary/10' },
    { label: 'High BP', icon: Stethoscope, color: 'text-blue-500 bg-blue-50' },
  ];

  const getApptPriority = (appt: any) => {
    const reminder = getAppointmentReminder(appt);
    if (!reminder) return 0;
    if (reminder.status === 'today') return 3;
    if (reminder.status === 'tomorrow') return 2;
    if (reminder.status === 'upcoming') return 1;
    return 0;
  };

  const sortedAppointments = [...appointments].sort((a, b) => getApptPriority(b) - getApptPriority(a));
  const visibleAppointments = isApptsExpanded ? sortedAppointments : sortedAppointments.slice(0, 1);

  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <div className="flex flex-col gap-8 pb-40 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      {/* Patient Greeting & Sign-Out (Full Width Header) */}
      <section className="relative z-30 flex justify-between items-center bg-white/40 p-4 rounded-3xl border border-white/50 backdrop-blur-md w-full shadow-xs">
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
            <h2 className="text-lg font-black text-slate-800">
              {t.welcome ? `${t.welcome}, ${session.username}` : `Hello, ${session.username}`}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Language Selector Button */}
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-primary hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
            title="Change Language"
          >
            <Globe size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
              {ALL_LANGUAGES.find(l => l.code === language)?.label || 'Language'}
            </span>
          </button>

          {/* Language Dropdown Menu */}
          <AnimatePresence>
            {showLangMenu && (
              <>
                {/* Backdrop overlay to close dropdown */}
                <div className="fixed inset-0 z-40" onClick={() => {
                  setShowLangMenu(false);
                  setLangQuery('');
                }} />
                
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 bg-white rounded-[2rem] border border-slate-100 p-3.5 shadow-xl z-50 w-64 flex flex-col gap-2.5"
                >
                  {/* Search Input */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                    <Globe size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search language..."
                      value={langQuery}
                      onChange={e => setLangQuery(e.target.value)}
                      className="w-full text-[16px] sm:text-xs font-bold bg-transparent border-none outline-none placeholder:text-slate-400 focus:ring-0 p-0 text-slate-700"
                    />
                    {langQuery && (
                      <button 
                        type="button"
                        onClick={() => setLangQuery('')}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1 cursor-pointer border-none bg-transparent"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
                    {/* Filtered list based on search query */}
                    {(() => {
                      const query = langQuery.trim().toLowerCase();
                      const filtered = ALL_LANGUAGES.filter(lang => 
                        lang.label.toLowerCase().includes(query) || 
                        lang.code.toLowerCase().includes(query)
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-4 text-[10px] text-slate-400 font-bold">
                            No languages found
                          </div>
                        );
                      }

                      const matchingActive = filtered.filter(l => activeLangs.includes(l.code));
                      const matchingOthers = filtered.filter(l => !activeLangs.includes(l.code));

                      return (
                        <>
                          {matchingActive.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">
                                {query ? 'Matching Active' : 'My Languages'}
                              </span>
                              {matchingActive.map((lang) => (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => {
                                    onPrefsChange({ language: lang.code });
                                    setShowLangMenu(false);
                                    setLangQuery('');
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border-none flex items-center justify-between ${
                                    language === lang.code 
                                      ? 'bg-primary/5 text-primary' 
                                      : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{lang.label}</span>
                                  {language === lang.code && <span className="text-[10px]">✓</span>}
                                </button>
                              ))}
                            </div>
                          )}

                          {matchingOthers.length > 0 && (
                            <div className="flex flex-col gap-1 border-t border-slate-50 pt-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">
                                {query ? 'Search Results' : 'Add Languages'}
                              </span>
                              {matchingOthers.map((lang) => (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => handleAddLanguage(lang.code)}
                                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-primary hover:bg-primary/5 transition-all border-none flex items-center justify-between"
                                >
                                  <span>{lang.label}</span>
                                  <span className="text-[9px] font-black uppercase text-primary/80 bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-md">
                                    + Add
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Sign Out Button */}
          <button 
            onClick={onSignOut}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </section>

      {/* Responsive Grid System for Desktop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
        
        {/* COLUMN 1 (Spans 2 cols on desktop, 1st on mobile): Combined Post-Loss Triage & Tracker Card */}
        <div className="lg:col-span-2 w-full">
          <Card id="tour-start-triage" className="p-6 sm:p-8 border-none bg-gradient-to-tr from-[#0F4C81] to-[#1e619c] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Combined Left Column: Post-Loss Recovery Triage */}
              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                    <Brain className="text-white animate-pulse" size={24} />
                  </div>
                  <button 
                    onClick={() => onPrefsChange({ voiceGuided: !prefs.voiceGuided })}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 border border-white/15 transition-all duration-300 cursor-pointer text-white shadow-inner active:scale-95 hover:scale-105"
                  >
                    <Mic size={12} className={prefs.voiceGuided ? 'animate-pulse text-emerald-300' : 'text-white/60'} />
                    <span>{t.voiceAssistant || "Voice Guide"}</span>
                    <div className={`w-6 h-3.5 rounded-full relative transition-colors duration-300 ${prefs.voiceGuided ? 'bg-emerald-500' : 'bg-white/20'}`}>
                      <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all duration-300 ${prefs.voiceGuided ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>
                </div>
                <h3 className="text-2xl font-black mb-2 tracking-tight">{t.aiTriage || "Post-Loss Recovery Triage"}</h3>
                <p className="text-blue-100/70 text-xs mb-6 leading-relaxed font-medium">
                  {t.triageDesc || "Start our confidential clinical assessment to understand your risk and get immediate care routing."}
                </p>
                <Button 
                  onClick={onStart}
                  className="w-full h-12 rounded-2xl bg-white text-[#0F4C81] hover:bg-blue-50 font-black uppercase tracking-wider text-xs shadow-xl shadow-blue-900/20 gap-2 cursor-pointer border-none"
                >
                  {t.startAssessment || "Start Recovery Test"}
                  <ChevronRight size={16} />
                </Button>
              </div>

              {/* Combined Right Column: Recovery Checklist (Vitals Tracker) */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col gap-5 backdrop-blur-md">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    {t.recoveryChecklist || "Recovery Checklist"}
                  </h4>
                  <Badge className="bg-emerald-400/20 text-emerald-300 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                    Streak: {streak} Days
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Water Tracker */}
                  <button 
                    onClick={() => {
                      setWaterGlasses(p => Math.min(10, p + 1));
                      if (waterGlasses === 7) setStreak(s => s + 1);
                    }}
                    className={`relative pt-7 pb-3 px-2 rounded-2xl bg-white/5 border text-center flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer text-white hover:-translate-y-1 hover:shadow-xl active:scale-95 ${
                      waterGlasses >= 8 ? 'bg-blue-500/20 border-blue-400/40' : 'border-white/10 hover:border-blue-300/30'
                    }`}
                  >
                    <div className="absolute top-2 right-2">
                      {waterGlasses >= 8 ? (
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-sm shadow-emerald-500/30">✓</div>
                      ) : (
                        <div className="w-4 h-4 bg-white/15 border border-white/20 rounded-full flex items-center justify-center text-white text-[9px] font-black hover:bg-white/30 transition-colors">+</div>
                      )}
                    </div>
                    <Droplets className={waterGlasses >= 8 ? 'text-blue-400 animate-bounce' : 'text-blue-300'} size={18} />
                    <span className="text-[8px] font-black text-blue-200/60 uppercase tracking-wider">
                      {t.hydrate || "Hydrate"}
                    </span>
                    <span className="text-[10px] font-black text-white">{waterGlasses}/8 Gl.</span>
                  </button>

                  {/* Meal Eaten */}
                  <button 
                    onClick={() => setMealEaten(p => !p)}
                    className={`relative pt-7 pb-3 px-2 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-95 ${
                      mealEaten 
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-white' 
                        : 'bg-white/5 border-white/10 hover:border-emerald-300/30 text-white'
                    }`}
                  >
                    <div className="absolute top-2 right-2">
                      {mealEaten ? (
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-sm shadow-emerald-500/30">✓</div>
                      ) : (
                        <div className="w-4 h-4 bg-white/10 border border-white/15 rounded-full flex items-center justify-center text-white/50 text-[9px] font-black">○</div>
                      )}
                    </div>
                    <ClipboardList className={mealEaten ? 'text-emerald-300' : 'text-blue-100/50'} size={18} />
                    <span className="text-[8px] font-black text-blue-200/60 uppercase tracking-wider">
                      {t.nutrition || "Nutrition"}
                    </span>
                    <span className="text-[10px] font-black text-white">{mealEaten ? 'Done' : 'Log'}</span>
                  </button>

                  {/* Med Tracker */}
                  <button 
                    onClick={() => setMedTaken(p => !p)}
                    className={`relative pt-7 pb-3 px-2 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-95 ${
                      medTaken 
                        ? 'bg-rose-500/20 border-rose-400/40 text-white' 
                        : 'bg-white/5 border-white/10 hover:border-rose-300/30 text-white'
                    }`}
                  >
                    <div className="absolute top-2 right-2">
                      {medTaken ? (
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-sm shadow-emerald-500/30">✓</div>
                      ) : (
                        <div className="w-4 h-4 bg-white/10 border border-white/15 rounded-full flex items-center justify-center text-white/50 text-[9px] font-black">○</div>
                      )}
                    </div>
                    <Heart className={medTaken ? 'text-rose-300' : 'text-blue-100/50'} size={18} />
                    <span className="text-[8px] font-black text-blue-200/60 uppercase tracking-wider">
                      {t.medicine || "Medicine"}
                    </span>
                    <span className="text-[10px] font-black text-white">{medTaken ? 'Taken' : 'Log'}</span>
                  </button>
                </div>

                {/* Daily Mood Check-In Section */}
                <div className="border-t border-white/10 pt-4.5 mt-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
                      {t.howAreYouFeeling || "How are you feeling today?"}
                    </span>
                  </div>

                  {!moodLoggedToday ? (
                    <div className="flex flex-wrap gap-2 py-1 justify-center sm:justify-start">
                      {[
                        { v: 1, l: 'Grieving' },
                        { v: 2, l: 'Stressed' },
                        { v: 3, l: 'Recovering' },
                        { v: 4, l: 'Supported' },
                        { v: 5, l: 'Hopeful' }
                      ].map(m => (
                        <button
                          key={m.v}
                          type="button"
                          disabled={loading}
                          onClick={() => handleMoodSubmit(m.v)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 text-white disabled:opacity-50 select-none"
                        >
                          {m.l}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-1 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl">
                      <span className="text-[11px] font-extrabold text-blue-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        Check-in complete
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMoodModal(true)}
                          className="text-[9px] font-black uppercase tracking-wider text-slate-800 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border-none"
                        >
                          View Message
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMoodLoggedToday(false);
                            localStorage.removeItem('carebridge_mood_logged_date');
                          }}
                          className="text-[9px] font-black uppercase tracking-wider text-blue-200 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
            {/* Decorative background pulse */}
            <div className="absolute -bottom-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-white">
              <HeartPulse size={200} strokeWidth={1} />
            </div>
          </Card>
        </div>

        {/* COLUMN 2 (Left on desktop, 2nd on mobile): Appointments & Reminders */}
        <div className="flex flex-col gap-6 w-full">
          {/* Appointments & Reminders Card */}
          <Card className="p-5 border-slate-100 rounded-[2rem] bg-white border flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {t.appointments || "Appointments & Reminders"}
              </h4>
              <button 
                onClick={() => setShowAddAppt(!showAddAppt)}
                className="text-[9px] font-black uppercase bg-primary/5 hover:bg-primary/10 text-primary px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {showAddAppt ? 'Close' : '+ Add'}
              </button>
            </div>

            {showAddAppt ? (
              <form onSubmit={handleAddAppt} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none"
                  >
                    <option value="Antenatal Visit">Antenatal Visit</option>
                    <option value="Post-Loss Follow-up">Post-Loss Follow-up</option>
                    <option value="General check-up">General Check-up</option>
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Schedule Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['weekly', 'none'].map(mode => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setNewRecur(mode)}
                        className={`py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${
                          newRecur === mode 
                            ? 'bg-[#0F4C81] text-white border-[#0F4C81]' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {mode === 'weekly' ? 'Weekly' : 'One-time'}
                      </button>
                    ))}
                  </div>
                </div>

                {newRecur === 'weekly' ? (
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Select Days of Week (Select multiple if needed)</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { v: 1, l: 'Mon' },
                        { v: 2, l: 'Tue' },
                        { v: 3, l: 'Wed' },
                        { v: 4, l: 'Thu' },
                        { v: 5, l: 'Fri' },
                        { v: 6, l: 'Sat' },
                        { v: 0, l: 'Sun' }
                      ].map(d => {
                        const isSelected = newDays.includes(d.v);
                        return (
                          <button
                            type="button"
                            key={d.v}
                            onClick={() => {
                              setNewDays(prev => 
                                prev.includes(d.v) 
                                  ? (prev.length > 1 ? prev.filter(x => x !== d.v) : prev) // keep at least one
                                  : [...prev, d.v]
                              );
                            }}
                            className={`py-1 px-2.5 text-[9px] font-black uppercase rounded-xl border transition-all ${
                              isSelected 
                                ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {d.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Date</label>
                    <input 
                      type="date" 
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Time</label>
                    <input 
                      type="time" 
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Notes</label>
                    <input 
                      type="text" 
                      placeholder="e.g. pack card, bring water"
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-9 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider">
                  Save Appointment
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <Calendar className="mx-auto text-slate-300 mb-1" size={20} />
                    <p className="text-[10px] text-slate-400 font-bold">No appointments tracked. Click + to add.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {visibleAppointments.map((appt) => {
                        const reminder = getAppointmentReminder(appt);
                        return (
                          <div 
                            key={appt.id} 
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative group overflow-hidden ${
                              reminder?.status === 'today' ? 'bg-rose-50/70 border-rose-100 text-rose-955 ring-2 ring-rose-500/10' :
                              reminder?.status === 'tomorrow' ? 'bg-amber-50/70 border-amber-100 text-amber-955' :
                              'bg-slate-50/40 border-slate-100 text-slate-700 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider block opacity-40">
                                  {appt.recurrence === 'weekly' 
                                    ? `Every ${
                                        Array.isArray(appt.daysOfWeek) 
                                          ? appt.daysOfWeek.map((d: number) => getDayName(d)).join(', ') 
                                          : getDayName(appt.dayOfWeek)
                                      }`
                                    : 'One-Time'}
                                </span>
                                <span className="font-extrabold text-xs block mt-0.5">{appt.type}</span>
                              </div>
                              
                              <button 
                                onClick={() => handleDeleteAppt(appt.id)}
                                className="absolute right-2 top-2 p-1 text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-opacity cursor-pointer border-none z-10"
                                title="Cancel appointment"
                              >
                                ✕
                              </button>

                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                reminder?.status === 'today' ? 'bg-rose-500 border-none text-white' :
                                reminder?.status === 'tomorrow' ? 'bg-amber-500 border-none text-white' :
                                'bg-slate-100 border-slate-200 text-slate-500'
                              }`}>
                                {reminder?.status === 'today' ? 'TODAY' : reminder?.status === 'tomorrow' ? 'TOMORROW' : appt.time}
                              </Badge>
                            </div>

                            {reminder && (
                              <div className={`p-2.5 rounded-xl text-[10px] font-bold leading-normal flex items-start gap-2 ${
                                reminder.status === 'today' ? 'bg-white/60 text-rose-955 border border-rose-200/30' :
                                reminder.status === 'tomorrow' ? 'bg-white/60 text-amber-955 border border-amber-200/30' :
                                'bg-slate-50/50 text-slate-600 border border-slate-100'
                              }`}>
                                <span className="shrink-0">📅</span>
                                <span>{reminder.message}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {appointments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsApptsExpanded(!isApptsExpanded)}
                        className="w-full text-center py-2 text-[10px] font-black uppercase text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-1 cursor-pointer border-none bg-transparent"
                      >
                        {isApptsExpanded ? (
                          <>Collapse Appointments ▴</>
                        ) : (
                          <>Show All Appointments ({appointments.length}) ▾</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* COLUMN 3 (Right on desktop, 3rd on mobile): Support & Emergency */}
        <div className="flex flex-col gap-6 w-full">
          {/* Nearby Support & Counseling Resources */}
          <Card className="p-5 border-slate-100 rounded-[2rem] bg-white border shadow-sm flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {t.supportClinical || "Support & Clinical Guidance"}
            </h4>
            
            {/* Primary Referral Clinic */}
            <div className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-xs hover:shadow-md transition-all border border-slate-100 cursor-pointer bg-white" onClick={onClinicSearch}>
               <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#2EC4B6]/10 rounded-xl flex items-center justify-center text-[#2EC4B6] shadow-inner shrink-0">
                     <MapPin size={22} />
                  </div>
                  <div>
                     <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <h5 className="font-extrabold text-sm text-slate-800">Lagos Maternal Center</h5>
                        <Badge variant="outline" className="text-[8px] h-3.5 bg-teal-50 border-teal-100 text-[#2EC4B6]">
                          {t.active || "ACTIVE"}
                        </Badge>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">1.2 km • Open 24/7</p>
                  </div>
               </div>
               <ChevronRight className="text-slate-300" size={16} />
            </div>

            {/* Counselor Directory */}
            <div 
              onClick={() => alert("Lagos Counseling Directory: Connecting with maternal health counselors & grief therapists in your local area...")}
              className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-xs hover:shadow-md transition-all border border-slate-100 cursor-pointer bg-white"
            >
               <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-inner shrink-0">
                     <Heart size={22} className="fill-purple-50" />
                  </div>
                  <div>
                     <h5 className="font-extrabold text-sm text-slate-800">Maternal Counselors</h5>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Therapist Directory</p>
                  </div>
               </div>
               <ChevronRight className="text-slate-300" size={16} />
            </div>

            {/* WhatsApp Counselor Chat */}
            <div 
              onClick={() => alert("Opening WhatsApp: Connecting with peer Loss & Recovery support counselors...")}
              className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-xs hover:shadow-md transition-all border border-slate-100 cursor-pointer bg-white"
            >
               <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                     <MessageSquare size={22} />
                  </div>
                  <div>
                     <h5 className="font-extrabold text-sm text-slate-800">WhatsApp Counselor</h5>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peer Support Chat</p>
                  </div>
               </div>
               <ChevronRight className="text-slate-300" size={16} />
            </div>
          </Card>

          {/* Emergency Quick Access */}
          <Button 
            variant="destructive"
            onClick={() => setShowEmergency(true)}
            className="w-full h-14 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-100 transition-all flex items-center justify-between px-6 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="group-hover:scale-125 transition-transform" />
              {t.emergency ? `${t.emergency} SOS Dispatch` : "Emergency SOS Dispatch"}
            </div>
            <ChevronRight size={20} />
          </Button>
        </div>

      </div>

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
                  className="w-full h-12 rounded-xl bg-[#0F4C81] text-white font-bold text-base cursor-pointer"
                  onClick={() => {
                    alert("Emergency call initiated...");
                    setShowEmergency(false);
                  }}
                >
                  Confirm Emergency Call
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full font-bold text-slate-400 cursor-pointer"
                  onClick={() => setShowEmergency(false)}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Wellness Check-In Result Modal */}
      <AnimatePresence>
        {showMoodModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoodModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.25rem] p-6 shadow-3xl text-center z-10 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Background gradient decorative element */}
              <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-[#0F4C81]/5 blur-2xl pointer-events-none" />
              
              <button
                onClick={() => setShowMoodModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>

              <div className="w-14 h-14 bg-gradient-to-tr from-primary to-[#0F4C81] rounded-2xl flex items-center justify-center text-white mx-auto mb-4.5 shadow-lg shadow-primary/10">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1.5">
                Daily Wellness Support
              </p>
              
              <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">
                {mood === 1 && "Grieving - We Stand With You"}
                {mood === 2 && "Stressed - Take A Deep Breath"}
                {mood === 3 && "Recovering - One Day At A Time"}
                {mood === 4 && "Supported - You Are Not Alone"}
                {mood === 5 && "Hopeful - Looking Forward"}
                {!mood && "Your Wellness Check-In"}
              </h3>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] leading-relaxed font-semibold italic text-slate-700 relative text-left mb-6">
                <span className="absolute top-1.5 left-2.5 text-slate-300 text-3xl select-none">“</span>
                <p className="pl-5 pr-2">
                  {loading ? 'Generating supportive words...' : (supportMessage || "We are here for you. Take it one day at a time.")}
                </p>
              </div>
              
              <Button 
                className="w-full h-12 rounded-xl bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white font-bold text-sm cursor-pointer shadow-md shadow-[#0F4C81]/15 border-none"
                onClick={() => setShowMoodModal(false)}
              >
                Close Check-in
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
