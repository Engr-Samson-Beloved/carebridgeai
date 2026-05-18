import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, Navigation, Sidebar } from './components/Navigation';
import { Landing } from './views/Landing';
import { Assessment } from './views/Assessment';
import { Referrals } from './views/Referrals';
import { Recovery } from './views/Recovery';
import { Dashboard } from './views/Dashboard';
import { AppView, Language, UserPreferences } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<any>(null);
  const [prefs, setPrefs] = useState<UserPreferences>({
    language: 'en',
    whatsappEnabled: false,
    voiceGuided: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        signInAnonymously(auth).catch(e => console.error("Auth error", e));
      }
    });
    return () => unsubscribe();
  }, []);

  const setLanguage = (lang: Language) => setPrefs(p => ({ ...p, language: lang }));
  const toggleWhatsapp = () => setPrefs(p => ({ ...p, whatsappEnabled: !p.whatsappEnabled }));
  const toggleVoice = () => setPrefs(p => ({ ...p, voiceGuided: !p.voiceGuided }));

  const renderView = () => {
    const commonProps = { 
      language: prefs.language, 
      prefs, 
      onPrefsChange: (newPrefs: Partial<UserPreferences>) => setPrefs(p => ({ ...p, ...newPrefs })) 
    };

    switch (view) {
      case 'landing':
        return <Landing onStart={() => setView('assessment')} onClinicSearch={() => setView('referral')} {...commonProps} />;
      case 'assessment':
        return <Assessment onBack={() => setView('landing')} onComplete={() => setView('referral')} {...commonProps} />;
      case 'referral':
        return <Referrals {...commonProps} />;
      case 'recovery':
        return <Recovery {...commonProps} />;
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      default:
        return <Landing onStart={() => setView('assessment')} onClinicSearch={() => setView('referral')} {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary flex">
      <Sidebar currentView={view} onViewChange={setView} language={prefs.language} setLanguage={setLanguage} />
      
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <Header language={prefs.language} setLanguage={setLanguage} />
        
        <main className="max-w-xl mx-auto w-full relative py-6 md:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        <Navigation currentView={view} onViewChange={setView} language={prefs.language} />
      </div>

      <footer className="hidden xl:block fixed bottom-8 right-8 text-right opacity-30 pointer-events-none">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Empowering Maternal Health Intelligence
        </p>
      </footer>
    </div>
  );
}

