import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  MapPin, 
  FileText, 
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Stethoscope,
  HeartPulse,
  Brain,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AppView, Language } from '../types';
import { translations } from '../translations';
import { 
  Globe,
  Mic,
  MicOff,
  PhoneCall
} from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  language: Language;
}

export function Navigation({ currentView, onViewChange, language }: NavigationProps) {
  const t = translations[language];
  const navItems = [
    { id: 'landing', label: t.landing, icon: Heart },
    { id: 'assessment', label: 'RiskAI', icon: Activity },
    { id: 'referral', label: t.findClinics || 'Clinics', icon: MapPin },
    { id: 'recovery', label: t.recovery, icon: Brain },
    { id: 'dashboard', label: t.referrals || 'Analytics', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-50 glass rounded-[2.5rem] px-4 py-3 md:hidden">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`relative flex flex-col items-center gap-1 p-2 transition-all duration-300 ${
                isActive ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] font-bold uppercase tracking-tight transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/5 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface SidebarProps extends NavigationProps {
  setLanguage: (lang: Language) => void;
}

export function Sidebar({ currentView, onViewChange, language, setLanguage }: SidebarProps) {
  const t = translations[language];
  const navItems = [
    { id: 'landing', label: t.landing, icon: Heart },
    { id: 'assessment', label: t.aiTriage, icon: Activity },
    { id: 'referral', label: t.referrals, icon: MapPin },
    { id: 'recovery', label: t.recovery, icon: Brain },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'sw', label: 'Swahili' },
    { code: 'yo', label: 'Yoruba' },
    { code: 'ha', label: 'Hausa' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-white border-r border-slate-100 p-8 z-50 overflow-y-auto">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <HeartPulse size={24} />
        </div>
        <h1 className="font-bold text-2xl tracking-tighter text-slate-900">
          CareBridge <span className="font-light text-slate-400">AI</span>
        </h1>
      </div>

      <div className="mb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Select Language</p>
        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                language === lang.code 
                  ? 'bg-primary/5 border-primary/20 text-primary' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={20} />
              <span className="truncate">{item.label}</span>
              {isActive && <ChevronRight size={16} className="ml-auto shrink-0" />}
            </button>
          );
        })}
      </nav>

      <div className="pt-8 mt-8 border-t border-slate-50 space-y-3">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400">
              <Mic size={16} />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500">Voice Guide</span>
          </div>
          <div className="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-red-200"
          onClick={() => alert("Connecting to emergency clinical support...")}
        >
          {t.emergency} SOS
          <AlertCircle size={18} />
        </Button>
      </div>
    </aside>
  );
}

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function Header({ language, setLanguage }: HeaderProps) {
  const [showLangs, setShowLangs] = React.useState(false);
  const t = translations[language];

  return (
    <header className="px-6 py-4 bg-white/80 backdrop-blur-lg sticky top-0 z-40 md:hidden flex items-center justify-between border-b border-slate-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
          <HeartPulse size={18} />
        </div>
        <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
          CareBridge
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => setShowLangs(!showLangs)}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <Globe size={18} />
          </button>
          
          <AnimatePresence>
            {showLangs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-40 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-50"
              >
                {['en', 'fr', 'sw', 'yo', 'ha'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang as Language);
                      setShowLangs(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                      language === lang ? 'bg-primary/5 text-primary' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : lang === 'sw' ? 'Swahili' : lang === 'yo' ? 'Yoruba' : 'Hausa'}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
           <Mic size={18} />
        </button>

        <button 
          onClick={() => alert("Initiating emergency clinical dispatch...")}
          className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500"
        >
          <PhoneCall size={18} />
        </button>
      </div>
    </header>
  );
}

