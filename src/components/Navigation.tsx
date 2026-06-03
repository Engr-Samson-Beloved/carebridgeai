import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  MapPin, 
  LayoutDashboard,
  HeartPulse,
  Brain,
  AlertCircle,
  Globe,
  Mic,
  PhoneCall,
  LogOut,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AppView, Language, UserPreferences, UserSession } from '../types';
import { translations } from '../translations';

interface NavigationProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  language: Language;
  prefs: UserPreferences;
  onPrefsChange: (prefs: Partial<UserPreferences>) => void;
  session?: UserSession | null;
}

export function Navigation({ currentView, onViewChange, language, session }: NavigationProps) {
  const t = translations[language];

  // Dynamic nav items based on role
  const isCHW = session?.role === 'chw';
  const navItems = isCHW 
    ? [
        { id: 'chw-dashboard', label: 'Health Worker Dashboard', icon: LayoutDashboard }
      ]
    : [
        { id: 'patient-dashboard', label: t.landing || 'Home', icon: Heart },
        { id: 'recovery', label: 'Recovery Test', icon: Brain },
        { id: 'referral', label: 'Care Options', icon: HeartPulse },
      ];

  if (!session) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/90 backdrop-blur-xl px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-8px_30px_rgba(15,76,129,0.06)] transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/90 md:hidden">
      <div className="flex justify-between items-center max-w-md mx-auto gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`relative flex flex-1 flex-col items-center gap-1 py-1.5 px-1 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'text-primary scale-105 font-bold' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300" />
              <span className={`text-[8.5px] font-bold uppercase tracking-tight transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-1.5 inset-y-0.5 bg-primary/8 rounded-xl -z-10"
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
  onSignOut: () => void;
}

export function Sidebar({ 
  currentView, 
  onViewChange, 
  language, 
  setLanguage, 
  prefs, 
  onPrefsChange, 
  session, 
  onSignOut 
}: SidebarProps) {
  const t = translations[language];

  // Dynamic nav items based on role
  const isCHW = session?.role === 'chw';
  const navItems = isCHW 
    ? [
        { id: 'chw-dashboard', label: 'Health Worker Console', icon: LayoutDashboard }
      ]
    : [
        { id: 'patient-dashboard', label: 'Patient Home', icon: Heart },
        { id: 'recovery', label: 'Recovery Test (API)', icon: Brain },
        { id: 'referral', label: 'Care Options', icon: HeartPulse },
      ];



  if (!session) return null;

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 bg-white border-r border-slate-100 p-8 z-50 overflow-y-auto">
      {/* Brand Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <HeartPulse size={24} />
        </div>
        <h1 className="font-bold text-2xl tracking-tighter text-slate-900">
          CareBridge <span className="font-light text-slate-400">AI</span>
        </h1>
      </div>

      {/* Navigation tabs (Moved to top) */}
      <nav className="space-y-1 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as AppView)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
                isActive 
                  ? 'bg-[#0F4C81] text-white shadow-lg shadow-blue-100' 
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

      <div className="border-t border-slate-100/60 my-4" />



      {/* Control Center (Toggles and Emergency SOS - Moved down) */}
      <div className="mb-6 space-y-2.5 flex-1 flex flex-col justify-end">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Control Center</p>

        {/* Voice Guide Toggle */}
        <div 
          onClick={() => onPrefsChange({ voiceGuided: !prefs.voiceGuided })}
          className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${prefs.voiceGuided ? 'bg-[#0F4C81] text-white' : 'bg-white text-slate-400'}`}>
              <Mic size={16} />
            </div>
            <span className="text-[9.5px] font-black uppercase text-slate-500">Voice Guide</span>
          </div>
          <div className={`w-8 h-4.5 rounded-full relative transition-colors ${prefs.voiceGuided ? 'bg-[#0F4C81]' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.75 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${prefs.voiceGuided ? 'right-1' : 'left-1'}`} />
          </div>
        </div>

        {/* WhatsApp Follow-up Toggle */}
        <div 
          onClick={() => onPrefsChange({ whatsappEnabled: !prefs.whatsappEnabled })}
          className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${prefs.whatsappEnabled ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'}`}>
              <MessageSquare size={16} />
            </div>
            <span className="text-[9.5px] font-black uppercase text-slate-500">WhatsApp Alert</span>
          </div>
          <div className={`w-8 h-4.5 rounded-full relative transition-colors ${prefs.whatsappEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.75 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${prefs.whatsappEnabled ? 'right-1' : 'left-1'}`} />
          </div>
        </div>

        {/* SOS Emergency button */}
        <Button 
          variant="destructive" 
          className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[9.5px] gap-2.5 shadow-md shadow-red-100 border-none"
          onClick={() => alert("Connecting to emergency clinical support...")}
        >
          SOS EMERGENCY
          <AlertCircle size={16} />
        </Button>
      </div>

      {/* Sign Out Section */}
      <div className="pt-4 border-t border-slate-100 mt-auto">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-slate-500 hover:text-rose-500 hover:bg-rose-50/50 transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          <span>Exit Portal</span>
        </button>
      </div>
    </aside>
  );
}

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  prefs: UserPreferences;
  onPrefsChange: (prefs: Partial<UserPreferences>) => void;
  session?: UserSession | null;
  onSignOut: () => void;
}

export function Header({ language, setLanguage, prefs, onPrefsChange, session, onSignOut }: HeaderProps) {
  const [showLangs, setShowLangs] = React.useState(false);
  const t = translations[language];

  if (!session) return null;

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
        {/* Language selector toggle */}
        <div className="relative">
          <button 
            id="tour-language"
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

        {/* Voice Guide Toggle */}
        <button 
          id="tour-voice"
          onClick={() => onPrefsChange({ voiceGuided: !prefs.voiceGuided })}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
            prefs.voiceGuided 
              ? 'bg-[#0F4C81] border-[#0F4C81] text-white shadow-sm' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}
          title="Toggle Voice Guide"
        >
           <Mic size={18} />
        </button>

        {/* WhatsApp Follow-up Toggle */}
        <button 
          onClick={() => onPrefsChange({ whatsappEnabled: !prefs.whatsappEnabled })}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
            prefs.whatsappEnabled 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
              : 'bg-slate-50 border-slate-100 text-slate-400'
          }`}
          title="Toggle WhatsApp Alerts"
        >
           <MessageSquare size={18} />
        </button>

        {/* SOS Emergency button */}
        <button 
          id="tour-sos"
          onClick={() => alert("Initiating emergency clinical dispatch...")}
          className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500"
        >
          <PhoneCall size={18} />
        </button>

        {/* Sign Out Button */}
        <button 
          onClick={onSignOut}
          className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
