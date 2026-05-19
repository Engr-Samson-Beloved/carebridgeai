import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Volume2,
  Droplets,
  Activity,
  HeartPulse,
  ClipboardList,
  Thermometer,
  Pill,
  ShieldAlert,
  AlertCircle,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [isListening, setIsListening] = useState(false);

  // Recovery Health Check States
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<{
    risk: 'low' | 'moderate' | 'high';
    text: string;
  } | null>(null);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);

  const [healthCheck, setHealthCheck] = useState({
    bleedingSeverity: 'none',
    soakingPads: false,
    bloodClots: false,
    cramping: false,
    oneSidedPain: false,
    painLevel: 'none',
    fainting: false,
    dizzy: false,
    weakness: false,
    prevMiscarriage: false,
    prevEctopic: false,
    fever: false,
    chills: false,
    foulDischarge: false,
    abortionProcedure: false,
    recentMedication: false,
    hypertension: false,
    diabetes: false,
    anemia: false,
    otherConditions: false,
  });

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
    speakText("Take a deep breath. Your body and heart deserve space to heal today.");
  };

  // Text-To-Speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-US' : (language === 'fr' ? 'fr-FR' : 'en-US');
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  // Speech Recognition for answers
  const startSpeechRecognitionForSection = (idx: number) => {
    setIsListening(true);
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'en' ? 'en-US' : 'fr-FR';
      
      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript.toLowerCase();
        
        if (idx === 0) {
          if (resultText.includes('heavy') || resultText.includes('severe') || resultText.includes('forte')) {
            setHealthCheck(p => ({ ...p, bleedingSeverity: 'heavy', soakingPads: true }));
          } else if (resultText.includes('moderate') || resultText.includes('moyenne')) {
            setHealthCheck(p => ({ ...p, bleedingSeverity: 'moderate' }));
          } else if (resultText.includes('spotting') || resultText.includes('gouttes')) {
            setHealthCheck(p => ({ ...p, bleedingSeverity: 'spotting' }));
          } else if (resultText.includes('none') || resultText.includes('rien')) {
            setHealthCheck(p => ({ ...p, bleedingSeverity: 'none', soakingPads: false }));
          }
          if (resultText.includes('yes') || resultText.includes('oui')) {
            setHealthCheck(p => ({ ...p, soakingPads: true }));
          }
        } else if (idx === 1) {
          if (resultText.includes('severe') || resultText.includes('grave')) {
            setHealthCheck(p => ({ ...p, painLevel: 'severe' }));
          } else if (resultText.includes('moderate') || resultText.includes('moyen')) {
            setHealthCheck(p => ({ ...p, painLevel: 'moderate' }));
          } else if (resultText.includes('mild') || resultText.includes('faible')) {
            setHealthCheck(p => ({ ...p, painLevel: 'mild' }));
          }
        } else if (idx === 2) {
          if (resultText.includes('yes') || resultText.includes('oui')) {
            setHealthCheck(p => ({ ...p, fainting: true, dizzy: true }));
          }
        } else if (idx === 4) {
          if (resultText.includes('yes') || resultText.includes('oui') || resultText.includes('fever') || resultText.includes('fièvre')) {
            setHealthCheck(p => ({ ...p, fever: true }));
          }
        }
        setIsListening(false);
      };
      
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      setTimeout(() => {
        setIsListening(false);
        alert("Voice recognition simulated. Speak your symptoms clearly now.");
      }, 1500);
    }
  };

  const playVoiceGuideForSection = (idx: number) => {
    const guides = [
      "Section 1: Bleeding history. Please select bleeding severity, whether you are soaking pads, and if you are passing blood clots.",
      "Section 2: Pain history. Select your pain level, and if you have cramping or one-sided localized pain.",
      "Section 3: Dizziness and fainting. Note if you have fainted, feel dizzy, or have severe body weakness.",
      "Section 4: Pregnancy history. Flag if you have a history of miscarriages or ectopic pregnancies.",
      "Section 5: Fever and infection. Flag if you have fever, chills, or abnormal discharge.",
      "Section 6: Procedure or medication. Have you had a surgical termination or taken medical abortion pills recently?",
      "Section 7: Existing medical conditions. Select any chronic conditions like high blood pressure, diabetes, or anemia."
    ];
    speakText(guides[idx]);
  };

  // Run AI Risk Logic
  const runRiskAssessment = () => {
    setAssessing(true);
    setTimeout(() => {
      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      let reasonText = '';

      if (
        healthCheck.bleedingSeverity === 'heavy' ||
        healthCheck.soakingPads ||
        healthCheck.fainting ||
        healthCheck.painLevel === 'severe' ||
        healthCheck.fever
      ) {
        riskLevel = 'high';
        const concerns = [];
        if (healthCheck.bleedingSeverity === 'heavy' || healthCheck.soakingPads) concerns.push("hemorrhaging indicators (heavy bleeding or soaking pads)");
        if (healthCheck.fainting) concerns.push("fainting episodes");
        if (healthCheck.painLevel === 'severe') concerns.push("severe abdominal pain");
        if (healthCheck.fever) concerns.push("fever (potential systemic infection)");
        
        reasonText = `Critical recovery indicators detected: ${concerns.join(', ')}. There is an elevated risk of severe post-pregnancy loss complications (e.g. retained products of conception, infection, or internal bleeding). Immediate medical attention is recommended.`;
      } else if (
        healthCheck.bleedingSeverity === 'moderate' ||
        healthCheck.painLevel === 'moderate' ||
        healthCheck.dizzy ||
        healthCheck.weakness ||
        healthCheck.chills ||
        healthCheck.foulDischarge ||
        healthCheck.prevEctopic
      ) {
        riskLevel = 'moderate';
        const concerns = [];
        if (healthCheck.bleedingSeverity === 'moderate') concerns.push("moderate bleeding");
        if (healthCheck.painLevel === 'moderate') concerns.push("moderate pain/cramping");
        if (healthCheck.dizzy || healthCheck.weakness) concerns.push("dizziness or physical weakness");
        if (healthCheck.foulDischarge) concerns.push("abnormal discharge");
        if (healthCheck.prevEctopic) concerns.push("previous ectopic pregnancy");

        reasonText = `Some recovery concerns flagged: ${concerns.join(', ')}. While not in acute distress, we advise booking a follow-up assessment with Lagos Maternal Center within 24 to 48 hours to ensure complete recovery.`;
      } else {
        riskLevel = 'low';
        reasonText = "Your recovery parameters appear stable. No primary red flags (such as hemorrhaging, high fever, or loss of consciousness) are present. Continue monitoring daily, rest, and keep hydrated.";
      }

      setAssessmentResult({
        risk: riskLevel,
        text: reasonText
      });
      setAssessing(false);
      
      // Speak result out loud for accessibility
      speakText(`Health check completed. Risk level is ${riskLevel}. ${reasonText}`);
    }, 1200);
  };

  const sections = [
    {
      title: "Bleeding History",
      icon: Droplets,
      content: (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Bleeding Severity</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['none', 'spotting', 'moderate', 'heavy'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setHealthCheck(prev => ({ ...prev, bleedingSeverity: opt }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.bleedingSeverity === opt ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Are you soaking pads?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, soakingPads: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.soakingPads === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Passing blood clots?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, bloodClots: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.bloodClots === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Pain History",
      icon: Activity,
      content: (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pain Intensity</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['none', 'mild', 'moderate', 'severe'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setHealthCheck(prev => ({ ...prev, painLevel: opt }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.painLevel === opt ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Experiencing cramping?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, cramping: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.cramping === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">One-sided localized pain?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, oneSidedPain: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.oneSidedPain === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Dizziness & Fainting",
      icon: HeartPulse,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">Any fainting / loss of consciousness?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, fainting: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.fainting === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Feeling dizzy or lightheaded?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, dizzy: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.dizzy === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Severe body weakness?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, weakness: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.weakness === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Pregnancy History",
      icon: ClipboardList,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Previous miscarriage history?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, prevMiscarriage: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.prevMiscarriage === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Previous ectopic pregnancy?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, prevEctopic: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.prevEctopic === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Fever & Infection Symptoms",
      icon: Thermometer,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">Do you have a fever?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, fever: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.fever === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Chills or body shivers?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, chills: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.chills === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Foul-smelling abnormal discharge?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, foulDischarge: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.foulDischarge === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Procedure or Medication History",
      icon: Pill,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Prior termination/abortion procedure?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, abortionProcedure: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.abortionProcedure === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Taken termination meds recently?</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setHealthCheck(prev => ({ ...prev, recentMedication: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.recentMedication === val ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Existing Medical Conditions",
      icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select all conditions that apply</span>
          <div className="flex flex-wrap gap-2">
            {[
              { k: 'hypertension', l: 'Hypertension' },
              { k: 'diabetes', l: 'Diabetes' },
              { k: 'anemia', l: 'Anemia' },
              { k: 'otherConditions', l: 'Other Conditions' },
            ].map(cond => (
              <button
                key={cond.k}
                onClick={() => setHealthCheck(prev => ({ ...prev, [cond.k]: !prev[cond.k as keyof typeof prev] }))}
                className={`py-2 px-3 text-xs font-black rounded-xl border transition-all ${healthCheck[cond.k as keyof typeof healthCheck] ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {cond.l}
              </button>
            ))}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="px-4 sm:px-6 pb-40">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{t.recovery}</h2>
        <p className="text-slate-500">Intelligent post-pregnancy recovery monitoring and supportive healing.</p>
      </div>

      {!supportMessage ? (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-8"
        >
          <Card className="p-5 sm:p-10 border-none bg-slate-900 text-white rounded-[2.25rem] sm:rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(15,76,129,0.3)] relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black tracking-tight">How are you heart-today?</h3>
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
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center transition-all shadow-lg ${
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
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 font-black transition-all shadow-xl shadow-black/20 text-base uppercase tracking-wider"
                >
                  {loading ? 'Processing...' : 'Log Daily Reflection'}
                </Button>
             </div>
             
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Wind size={180} strokeWidth={1} />
             </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <button className="p-4 sm:p-6 bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <Bird size={24} />
               </div>
               <span className="text-xs font-black text-slate-800 uppercase tracking-widest leading-tight">Coping<br/>Resources</span>
            </button>
            <button className="p-4 sm:p-6 bg-white rounded-[1.75rem] sm:rounded-[2rem] border border-slate-100 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
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
          <Card className="p-5 sm:p-10 border-none bg-emerald-50 rounded-[2.25rem] sm:rounded-[3rem] relative shadow-lg overflow-hidden">
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
                    className="rounded-2xl bg-emerald-600 text-white h-12 font-black hover:bg-emerald-700 transition-all uppercase tracking-widest text-sm shadow-xl shadow-emerald-200"
                    onClick={() => { setSupportMessage(null); setMood(null); setNote(''); }}
                  >
                    Done for Today
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={simulatePostToWhatsapp}
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

      {/* Recovery Health Check Upgraded Section */}
      <div className="mt-12 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">Recovery Health Check</h4>
            <p className="text-xs text-slate-500">Post-loss reproductive symptoms & danger signs tracker</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => speakText("Recovery Health Check. We will evaluate seven short sections for bleeding, pain, and general indicators to monitor your post-loss recovery.")}
              className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all ${isSpeaking ? 'bg-secondary/10 border-secondary text-secondary' : ''}`}
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>

        {/* Expandable Accordion System */}
        <div className="space-y-3">
          {sections.map((sect, idx) => {
            const Icon = sect.icon;
            const isOpen = activeSection === idx;
            return (
              <Card 
                key={idx} 
                className={`border border-slate-100 overflow-hidden transition-all shadow-sm ${
                  isOpen ? 'ring-2 ring-[#0F4C81]/10 border-[#0F4C81]/25 bg-slate-50/20' : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                <button
                  onClick={() => setActiveSection(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between font-bold text-slate-800 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOpen ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon size={16} />
                    </div>
                    <span className="font-extrabold">{sect.title}</span>
                  </div>
                  <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-[#0F4C81]' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-4">
                    {/* Voice Access Panel */}
                    <div className="flex gap-2 justify-end mb-2 border-b border-slate-100/50 pb-2">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mr-auto flex items-center gap-1.5">
                        <Volume2 size={10} /> Voice Guidance Active
                      </span>
                      <button 
                        onClick={() => playVoiceGuideForSection(idx)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                        title="Read instructions out loud"
                      >
                        <Volume2 size={12} />
                      </button>
                      <button 
                        onClick={() => startSpeechRecognitionForSection(idx)}
                        className={`p-1 rounded-md transition-colors ${isListening ? 'bg-primary/20 text-primary animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}
                        title="Answer by voice"
                      >
                        <Mic size={12} />
                      </button>
                    </div>

                    {sect.content}
                    
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => setActiveSection(idx === sections.length - 1 ? null : idx + 1)}
                        className="bg-[#0F4C81] text-white hover:bg-[#0F4C81]/90 font-bold text-[10px] h-8 rounded-xl px-3 uppercase tracking-wider"
                      >
                        {idx === sections.length - 1 ? 'Finish Section' : 'Next Section'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Submit Assessment trigger */}
        <div className="pt-2">
          <Button
            onClick={runRiskAssessment}
            className="w-full h-12 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-extrabold tracking-wider uppercase text-xs shadow-lg shadow-secondary/20"
          >
            {assessing ? 'AI Reassessing Recovery Risk...' : 'Run AI Health Check Assessment'}
          </Button>
        </div>

        {/* AI Output Result Card */}
        {assessmentResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card className={`p-5 rounded-[2rem] border relative overflow-hidden ${
              assessmentResult.risk === 'high' 
                ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                : (assessmentResult.risk === 'moderate' 
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950' 
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950')
            }`}>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Recovery Risk Assessment</span>
                  <Badge className={`uppercase text-[9px] font-black tracking-wider px-3.5 py-0.5 rounded-full ${
                    assessmentResult.risk === 'high' 
                      ? 'bg-rose-600 text-white' 
                      : (assessmentResult.risk === 'moderate' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-emerald-600 text-white')
                  }`}>
                    {assessmentResult.risk} RISK
                  </Badge>
                </div>
                
                <h4 className="font-extrabold text-sm mb-2 flex items-center gap-2">
                  <HeartPulse size={16} />
                  CareBridge AI Clinical Insight
                </h4>
                <p className="text-xs leading-relaxed mb-4 font-medium">
                  {assessmentResult.text}
                </p>

                {/* WhatsApp follow-up checkbox */}
                <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="whatsappOptIn"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="whatsappOptIn" className="text-[10.5px] font-medium text-slate-600 cursor-pointer leading-tight">
                    Opt into symptom follow-ups, daily reminders & wellness check-ins on WhatsApp
                  </label>
                </div>
              </div>
            </Card>

            {/* Emergency Escalation Panel for High Risk */}
            {assessmentResult.risk === 'high' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 border-none bg-rose-600 text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
                        <AlertTriangle size={20} />
                      </div>
                      <h4 className="font-black text-base tracking-tight">Emergency Care Route Active</h4>
                    </div>
                    
                    <p className="text-xs text-rose-100 leading-relaxed font-medium">
                      Critical danger indicators are present. CareBridge AI has simulated an urgent clinical notification dispatch to Lagos Maternal Center. Please call our clinical coordinator immediately.
                    </p>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => { setShowEmergencyCall(true); alert("Connecting with Lagos Maternal Center Emergency Desk..."); }}
                        className="flex-1 h-10 bg-white hover:bg-rose-50 text-rose-600 font-extrabold rounded-xl uppercase tracking-wider text-[10px] gap-2 shadow-lg shadow-rose-900/20"
                      >
                        <Phone size={14} /> Call Coordinator
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => alert("Clinic notified: Patient has marked intent to arrive within 15 minutes.")}
                        className="h-10 border border-white/30 hover:bg-white/10 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px]"
                      >
                        Map Route
                      </Button>
                    </div>
                  </div>
                  {/* Watermark */}
                  <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                    <ShieldAlert size={120} />
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

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
