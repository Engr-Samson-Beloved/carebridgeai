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
  ClipboardList,
  Calendar,
  Clock
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
  const [newType, setNewType] = useState('Antenatal Visit');
  const [newRecur, setNewRecur] = useState('weekly');
  const [newDay, setNewDay] = useState(4); // Thursday
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
    
    const newAppt = {
      id: `appt-${Date.now()}`,
      type: newType,
      recurrence: newRecur,
      dayOfWeek: newRecur === 'weekly' ? Number(newDay) : null,
      date: newRecur === 'none' ? newDate : null,
      time: newTime,
      notes: newNotes
    };
    
    saveAppointments([...appointments, newAppt]);
    setShowAddAppt(false);
    setNewNotes('');
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
      const targetDay = Number(appt.dayOfWeek); // 0-6
      const currentDay = today.getDay();
      
      const diff = (targetDay - currentDay + 7) % 7;
      if (diff === 0) {
        return {
          status: 'today',
          message: `Your recurring ${appt.type} is TODAY! ${appt.notes || 'Remember to pack your card and keep hydrated.'}`
        };
      } else if (diff === 1) {
        return {
          status: 'tomorrow',
          message: `Reminder: Your recurring ${appt.type} is TOMORROW (${getDayName(targetDay)})! ${appt.notes || 'Remember to pack your card and prepare your questions.'}`
        };
      } else {
        return {
          status: 'upcoming',
          message: `Next recurring ${appt.type} is next ${getDayName(targetDay)}. ${appt.notes || ''}`
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

  return (
    <div className="flex flex-col gap-8 pb-40 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      {/* Patient Greeting & Sign-Out (Full Width Header) */}
      <section className="flex justify-between items-center bg-white/40 p-4 rounded-3xl border border-white/50 backdrop-blur-md w-full shadow-xs">
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
          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </section>

      {/* Responsive Grid System for Desktop layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start w-full">
        
        {/* COLUMN 1: Vitals checklists & Appointments */}
        <div className="flex flex-col gap-6">
          {/* Recovery Streak & Vitals Tracker */}
          <Card className="p-6 border-slate-100 rounded-[2rem] bg-white shadow-sm flex flex-col gap-5 border">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Recovery Checklist</h4>
              <Badge className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
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
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Droplets className="text-blue-500" size={18} />
                <span className="text-[8px] font-black text-slate-400 uppercase">Hydrate</span>
                <span className="text-[10px] font-black text-slate-800">{waterGlasses}/8 Gl.</span>
              </button>

              {/* Meal Eaten */}
              <button 
                onClick={() => setMealEaten(p => !p)}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  mealEaten ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                }`}
              >
                <ClipboardList className={mealEaten ? 'text-emerald-500' : 'text-slate-400'} size={18} />
                <span className="text-[8px] font-black text-slate-400 uppercase">Nutrition</span>
                <span className="text-[10px] font-black text-slate-800">{mealEaten ? 'Done' : 'Log'}</span>
              </button>

              {/* Med Tracker */}
              <button 
                onClick={() => setMedTaken(p => !p)}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  medTaken ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                }`}
              >
                <Heart className={medTaken ? 'text-rose-500' : 'text-slate-400'} size={18} />
                <span className="text-[8px] font-black text-slate-400 uppercase">Medicine</span>
                <span className="text-[10px] font-black text-slate-800">{medTaken ? 'Taken' : 'Log'}</span>
              </button>
            </div>
          </Card>

          {/* Appointments & Reminders Card */}
          <Card className="p-5 border-slate-100 rounded-[2rem] bg-white border flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Appointments & Reminders</h4>
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
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select Day</label>
                    <select 
                      value={newDay} 
                      onChange={e => setNewDay(Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none"
                    >
                      <option value="1">Every Monday</option>
                      <option value="2">Every Tuesday</option>
                      <option value="3">Every Wednesday</option>
                      <option value="4">Every Thursday</option>
                      <option value="5">Every Friday</option>
                      <option value="6">Every Saturday</option>
                      <option value="0">Every Sunday</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select Date</label>
                    <input 
                      type="date" 
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
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
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Preparation Note</label>
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
                  appointments.map((appt) => {
                    const reminder = getAppointmentReminder(appt);
                    return (
                      <div 
                        key={appt.id} 
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 relative group overflow-hidden ${
                          reminder?.status === 'today' ? 'bg-rose-50/70 border-rose-100 text-rose-950 ring-2 ring-rose-500/10' :
                          reminder?.status === 'tomorrow' ? 'bg-amber-50/70 border-amber-100 text-amber-950' :
                          'bg-slate-50/40 border-slate-100 text-slate-700 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-wider block opacity-40">
                              {appt.recurrence === 'weekly' ? 'Weekly' : 'One-Time'}
                            </span>
                            <span className="font-extrabold text-xs block mt-0.5">{appt.type}</span>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteAppt(appt.id)}
                            className="absolute right-2 top-2 p-1 text-[10px] text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
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
                            reminder.status === 'today' ? 'bg-white/60 text-rose-950 border border-rose-200/30' :
                            reminder.status === 'tomorrow' ? 'bg-white/60 text-amber-950 border border-amber-200/30' :
                            'bg-slate-50/50 text-slate-600 border border-slate-100'
                          }`}>
                            <span className="shrink-0">📅</span>
                            <span>{reminder.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>
        </div>

        {/* COLUMN 2: Main AI Assessment Card & Danger Chips */}
        <div className="flex flex-col gap-6">
          {/* Main AI Assessment Card */}
          <Card id="tour-start-triage" className="p-6 border-none bg-gradient-to-tr from-[#0F4C81] to-[#1e619c] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
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
                  className="w-full h-12 rounded-2xl bg-white text-[#0F4C81] hover:bg-blue-50 font-black uppercase tracking-wider text-xs shadow-xl shadow-blue-900/20 gap-2 cursor-pointer"
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

          {/* Quick Symptom Chips */}
          <Card className="p-5 border-slate-100 rounded-[2rem] bg-white border shadow-sm">
            <div className="flex justify-between items-center mb-4 ml-1">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Quick Risk Triggers</h4>
              <Volume2 size={14} className="text-slate-300" />
            </div>
            <div className="flex flex-wrap gap-2">
              {symptomChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={onStart}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full font-bold text-xs border border-transparent hover:border-slate-200 transition-all shadow-xs cursor-pointer ${chip.color}`}
                >
                  <chip.icon size={12} />
                  {chip.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* COLUMN 3: Nearby Support Clinics & Emergency Quick Actions */}
        <div className="flex flex-col gap-6">
          {/* Nearby Support & Counseling Resources */}
          <Card className="p-5 border-slate-100 rounded-[2rem] bg-white border shadow-sm flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Support & Clinical Guidance</h4>
            
            {/* Primary Referral Clinic */}
            <div className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-xs hover:shadow-md transition-all border border-slate-100 cursor-pointer bg-white" onClick={onClinicSearch}>
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
              Emergency SOS Dispatch
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
    </div>
  );
}
