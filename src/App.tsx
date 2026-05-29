import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, Navigation, Sidebar } from './components/Navigation';
import { Login } from './views/Login';
import { PatientDashboard } from './views/PatientDashboard';
import { CHWDashboard } from './views/CHWDashboard';
import { Assessment } from './views/Assessment';
import { Referrals } from './views/Referrals';
import { Recovery } from './views/Recovery';
import { OnboardingTour } from './components/OnboardingTour';
import { AppView, Language, UserPreferences, UserSession } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [view, setView] = useState<AppView>('login');
  const [user, setUser] = useState<any>(null);
  const [tourStep, setTourStep] = useState<number | null>(null);
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

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    setView(newSession.role === 'patient' ? 'patient-dashboard' : 'chw-dashboard');
    
    // Automatically trigger live walkthrough for patients on first login
    if (newSession.role === 'patient') {
      const isCompleted = localStorage.getItem('carebridge_tour_completed');
      if (!isCompleted) {
        // Delay slightly for dashboard layout initialization
        setTimeout(() => {
          setTourStep(0);
        }, 800);
      }
    }
  };

  const handleSignOut = () => {
    setSession(null);
    setTourStep(null);
    setView('login');
  };

  const handleNextTourStep = () => {
    setTourStep(prev => {
      if (prev === null) return null;
      if (prev >= 3) {
        localStorage.setItem('carebridge_tour_completed', 'true');
        return null;
      }
      return prev + 1;
    });
  };

  const handleSkipTour = () => {
    localStorage.setItem('carebridge_tour_completed', 'true');
    setTourStep(null);
  };

  const renderView = () => {
    const commonProps = { 
      language: prefs.language, 
      prefs, 
      onPrefsChange: (newPrefs: Partial<UserPreferences>) => setPrefs(p => ({ ...p, ...newPrefs })) 
    };

    switch (view) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'patient-dashboard':
        return (
          <PatientDashboard 
            onStart={() => setView('recovery')} 
            onClinicSearch={() => setView('referral')} 
            session={session!} 
            onSignOut={handleSignOut} 
            {...commonProps} 
          />
        );
      case 'assessment':
        return <Assessment onBack={() => setView('patient-dashboard')} onComplete={() => setView('referral')} {...commonProps} />;
      case 'referral':
        return <Referrals onBack={() => setView('patient-dashboard')} {...commonProps} />;
      case 'recovery':
        return <Recovery session={session!} onBack={() => setView('patient-dashboard')} {...commonProps} />;
      case 'chw-dashboard':
        return <CHWDashboard session={session!} onSignOut={handleSignOut} {...commonProps} />;
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  // If not logged in, render the login page directly in a clean full screen container without sidebars or navigations
  if (!session || view === 'login') {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary flex">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        language={prefs.language} 
        setLanguage={setLanguage} 
        prefs={prefs}
        onPrefsChange={(newPrefs) => setPrefs(p => ({ ...p, ...newPrefs }))}
        session={session}
        onSignOut={handleSignOut}
      />
      
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen overflow-x-hidden">
        <Header 
          language={prefs.language} 
          setLanguage={setLanguage} 
          prefs={prefs}
          onPrefsChange={(newPrefs) => setPrefs(p => ({ ...p, ...newPrefs }))}
          session={session}
          onSignOut={handleSignOut}
        />
        
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

        <Navigation 
          currentView={view} 
          onViewChange={setView} 
          language={prefs.language} 
          prefs={prefs}
          onPrefsChange={(newPrefs) => setPrefs(p => ({ ...p, ...newPrefs }))}
          session={session}
        />
      </div>

      <footer className="hidden xl:block fixed bottom-8 right-8 text-right opacity-30 pointer-events-none">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Empowering Maternal Health Intelligence
        </p>
      </footer>

      {/* Onboarding Tour overlay component */}
      {tourStep !== null && (
        <OnboardingTour 
          step={tourStep} 
          onNext={handleNextTourStep} 
          onSkip={handleSkipTour} 
        />
      )}
    </div>
  );
}
