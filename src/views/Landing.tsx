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
  const [patients, setPatients] = React.useState<any[]>([]);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    if (prefs.chwMode) {
      const raw = localStorage.getItem("chw_patients");
      if (raw) {
        setPatients(JSON.parse(raw));
      } else {
        const initialMock = [
          {
            id: "P-4821",
            name: "Patient P-4821",
            age: 28,
            location: "Lagos",
            date: "2026-05-28",
            riskLevel: "Medium",
            prediction: 1,
            probability: 0.51,
            action: "Confirm follow-up appointment is scheduled before discharge. Call or text patient within 48 hours to confirm attendance. Flag for community health worker check-in.",
            careGaps: [
              "Patient was not referred for further care — referral is the strongest predictor of follow-up completion",
              "Male partner was not included in post-loss counselling — reduces likelihood of follow-up attendance"
            ],
            equityFlags: ["Below average socioeconomic status — cost of follow-up care may be a barrier"],
            mentalHealthFlag: false,
            mentalHealthNote: "No immediate mental health risk factors identified.",
            followUpRecommendation: "Schedule follow-up appointment within 1 week."
          },
          {
            id: "P-1934",
            name: "Patient P-1934",
            age: 31,
            location: "Lagos",
            date: "2026-05-27",
            riskLevel: "High",
            prediction: 0,
            probability: 0.88,
            action: "Immediate hospital transfer recommended. Notify clinic coordinator.",
            careGaps: [
              "No contraceptive counselling",
              "Partner not involved in counselling",
              "Rushed discharge (less than 12 hours stay)"
            ],
            equityFlags: ["Rural location barrier", "No formal referral system at this facility"],
            mentalHealthFlag: true,
            mentalHealthNote: "Grief distress flagged. Grief support and counselling recommended.",
            followUpRecommendation: "Arrange immediate home nurse check-in and partner counselling session."
          }
        ];
        localStorage.setItem("chw_patients", JSON.stringify(initialMock));
        setPatients(initialMock);
      }
    }
  }, [prefs.chwMode]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("Successfully synced all local registries to CareBridge Cloud Server!");
    }, 1500);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patients, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CHW_Registry_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the local registry?")) {
      localStorage.removeItem("chw_patients");
      setPatients([]);
    }
  };

  const symptomChips = [
    { label: t.quickSymptom === 'Àmì Àìsàn Kíákíá' ? 'Ìsun ẹ̀jẹ̀' : 'Bleeding', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
    { label: 'Severe Cramps', icon: Activity, color: 'text-orange-500 bg-orange-50' },
    { label: 'Fever', icon: HeartPulse, color: 'text-primary bg-primary/10' },
    { label: 'Dizziness', icon: Info, color: 'text-secondary bg-secondary/10' },
    { label: 'High BP', icon: Stethoscope, color: 'text-blue-500 bg-blue-50' },
  ];

  if (prefs.chwMode) {
    const totalCount = patients.length;
    const highRiskCount = patients.filter(p => p.riskLevel === 'High').length;
    const medRiskCount = patients.filter(p => p.riskLevel === 'Medium' || p.riskLevel === 'Moderate').length;

    return (
      <div className="flex flex-col gap-6 pb-40 px-4 sm:px-6">
        {/* CHW Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-[#0F4C81] tracking-tight">CHW Registry</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Multi-Patient Screening Console</p>
          </div>
          <Badge className="bg-[#0F4C81] text-white text-[9px] font-black tracking-widest px-3 py-1 uppercase rounded-full">
            Active console
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 border-slate-100 bg-slate-50 text-center flex flex-col justify-center">
            <span className="text-2xl font-black text-slate-800">{totalCount}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mt-1">Screened</span>
          </Card>
          <Card className="p-4 border-rose-100 bg-rose-50 text-center flex flex-col justify-center">
            <span className="text-2xl font-black text-rose-600">{highRiskCount}</span>
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider mt-1">High Risk</span>
          </Card>
          <Card className="p-4 border-orange-100 bg-amber-50 text-center flex flex-col justify-center">
            <span className="text-2xl font-black text-amber-600">{medRiskCount}</span>
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider mt-1">Med Risk</span>
          </Card>
        </div>

        {/* Main Console Actions */}
        <Card className="p-5 border border-slate-100 rounded-3xl bg-white shadow-sm flex flex-col gap-3">
          <Button 
            onClick={onStart}
            className="w-full h-12 rounded-2xl bg-[#0F4C81] hover:bg-[#0F4C81]/95 text-white font-black uppercase text-xs tracking-wider gap-2 shadow-lg shadow-blue-100"
          >
            <Plus size={16} /> Screen New Patient
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="h-10 rounded-xl font-bold text-[10px] uppercase border-slate-200 text-slate-600"
            >
              {syncing ? "Syncing..." : "Sync Records"}
            </Button>
            <Button 
              onClick={handleExport}
              variant="outline"
              className="h-10 rounded-xl font-bold text-[10px] uppercase border-slate-200 text-slate-600"
            >
              Export JSON
            </Button>
          </div>
        </Card>

        {/* Patient Registry List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Patient screenings ({totalCount})</h4>
            {totalCount > 0 && (
              <button 
                onClick={handleClear}
                className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider"
              >
                Clear Local
              </button>
            )}
          </div>

          {totalCount === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-200 rounded-3xl">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No screenings recorded today</p>
            </Card>
          ) : (
            patients.map((p) => (
              <Card key={p.id} className="p-4 border-slate-100 rounded-2xl bg-white shadow-xs border flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-800">{p.name}</h5>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Age {p.age} • {p.location} • {p.date}
                    </span>
                  </div>
                  <Badge className={`uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full ${
                    p.riskLevel === 'High' ? 'bg-rose-600 text-white' : 
                    p.riskLevel === 'Medium' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {p.riskLevel}
                  </Badge>
                </div>

                {/* Follow-up Likelihood Indicator */}
                {p.prediction !== undefined && p.probability !== undefined && (
                  <div className="p-2 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Follow-up Likelihood</span>
                      <span>{p.prediction === 1 ? 'Likely' : 'Unlikely'} ({Math.round(p.probability * 100)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${p.prediction === 1 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${p.probability * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Care Gaps Summary */}
                {p.careGaps && p.careGaps.length > 0 && (
                  <div className="text-[10px] text-amber-700 font-bold leading-normal flex items-start gap-1">
                    <span>⚠️</span>
                    <span>{p.careGaps.length} care gap(s) identified (e.g. {p.careGaps[0]})</span>
                  </div>
                )}

                {/* Action instruction */}
                {p.action && (
                  <div className="text-[10px] text-slate-500 font-semibold bg-slate-50/50 p-2.5 rounded-xl border border-slate-50 leading-relaxed">
                    <span className="font-extrabold text-slate-700 block text-[8px] uppercase tracking-wider mb-0.5">Directive Action</span>
                    {p.action}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

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
        <Card className="p-6 border-none bg-[#0F4C81] text-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
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
            <h3 className="text-xl font-extrabold mb-2 tracking-tight">{t.aiTriage}</h3>
            <p className="text-blue-100/70 text-xs mb-6 leading-relaxed font-medium">
              {t.triageDesc}
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={onStart}
                className="w-full h-12 rounded-2xl bg-white text-[#0F4C81] hover:bg-blue-50 font-bold text-base shadow-xl shadow-blue-900/40 gap-2"
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
          className="w-full h-13 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-500 font-black uppercase tracking-widest text-xs hover:bg-rose-100 transition-all flex items-center justify-between px-6 group"
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
        <Card className="p-5 border-slate-100 rounded-[1.75rem] bg-slate-50/50 border relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
              <MessageSquare size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-sm text-slate-800">{t.whatsappSetup}</h4>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.active}</p>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.whatsappEnabled} 
              onChange={() => onPrefsChange({ whatsappEnabled: !prefs.whatsappEnabled })}
              className="w-10 h-6 bg-slate-200 checked:bg-emerald-500 appearance-none rounded-full relative cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all shadow-inner"
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
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
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-3xl text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6 ring-8 ring-rose-50/50">
                <AlertTriangle size={32} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3 tracking-tight">{t.emergencyEscalation}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                {t.notifyingClinic}
              </p>
              
              <div className="space-y-2">
                <Button 
                  className="w-full h-12 rounded-xl bg-[#0F4C81] text-white font-bold text-base"
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


      {/* Care & Recover      <section className="grid grid-cols-1 gap-3">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 ml-1">Nearby Support</h4>
        
        <Card className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClinicSearch}>
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
        
        <Card className="p-4 border-slate-100 rounded-[1.75rem] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
           <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-inner shrink-0">
                 <Heart size={22} />
              </div>
              <div>
                 <h5 className="font-extrabold text-sm text-slate-800">Emotional Wellness</h5>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Compassionate AI Support</p>
              </div>
           </div>
           <ChevronRight className="text-slate-300" size={16} />
        </Card>
      </section>
      </section>

      {/* Safety Carousel */}
      <section className="bg-slate-900 mx-[-16px] sm:mx-[-24px] px-6 sm:px-8 py-8 text-white rounded-t-[2.5rem] sm:rounded-t-[3rem]">
        <div className="flex justify-between items-center mb-5">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Maternal Safety Tips</h4>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
           <div className="flex gap-3 items-start">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                 <Shield className="text-secondary" size={20} />
              </div>
              <div>
                 <h5 className="font-extrabold text-base mb-0.5 leading-tight">Monitor your iron levels</h5>
                 <p className="text-xs text-white/60 leading-relaxed font-medium capitalize">Iron deficiency can increase pregnancy complications. Consult your doctor for supplements.</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
