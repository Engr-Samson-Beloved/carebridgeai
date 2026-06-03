import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Stethoscope,
  HeartPulse,
  Brain,
  Shield,
  ShieldCheck,
  Mic,
  Volume2,
  PhoneCall,
  Bell
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { RiskLevel, Language, UserPreferences } from '../types';
import { explainRisk } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { translations } from '../translations';

interface AssessmentProps {
  onBack: () => void;
  onComplete: () => void;
  language: Language;
  prefs: UserPreferences;
}

export function Assessment({ onBack, onComplete, language, prefs }: AssessmentProps) {
  const t = translations[language] || translations['en'];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const [formData, setFormData] = useState({
    pregnancyWeek: 8,
    bleeding: 0,
    abdominalPain: 0,
    dizziness: false,
    fever: false,
    hypertension: false,
    priorMiscarriage: false,
    chronicConditions: [] as string[]
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const calculateRisk = () => {
    let score = 0;
    score += formData.bleeding * 35;
    score += formData.abdominalPain * 25;
    if (formData.hypertension) score += 20;
    if (formData.fever) score += 15;
    if (formData.dizziness) score += 10;
    if (formData.priorMiscarriage) score += 20;

    let level = RiskLevel.LOW;
    if (score >= 60 || formData.bleeding === 3) level = RiskLevel.HIGH;
    else if (score > 30) level = RiskLevel.MODERATE;

    return { score, level };
  };

  const handleFinish = async () => {
    setLoading(true);
    const { score, level } = calculateRisk();
    
    const assessmentData: any = {
      userId: auth.currentUser?.uid || 'anonymous',
      pregnancyWeek: formData.pregnancyWeek,
      symptoms: {
        bleeding: formData.bleeding,
        abdominalPain: formData.abdominalPain,
        dizziness: formData.dizziness,
        fever: formData.fever,
        hypertension: formData.hypertension
      },
      history: {
        priorMiscarriage: formData.priorMiscarriage,
        chronicConditions: formData.chronicConditions
      },
      riskScore: score,
      riskLevel: level,
      language,
      timestamp: new Date().toISOString()
    };

    const aiOutput = await explainRisk(assessmentData);
    
    try {
      if (auth.currentUser) {
        await addDoc(collection(db, 'assessments'), assessmentData);
      }
    } catch (e) {
      console.error("Save error", e);
    }

    setResult({ ...assessmentData, aiOutput });
    setLoading(false);
    setStep(5);

    if (level === RiskLevel.HIGH) {
      setShowEmergencyModal(true);
    }
  };

  const simulateVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setFormData(prev => ({ ...prev, bleeding: 1, dizziness: true }));
      setStep(3);
    }, 2500);
  };

  const OptionCard = ({ label, value, isActive, onClick, icon: Icon }: any) => (
    <button
      onClick={onClick}
      className={`w-full p-4 sm:p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${
        isActive 
          ? 'border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81]' 
          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} className={isActive ? 'text-[#0F4C81]' : 'text-slate-400'} />}
        <span className="font-bold">{label}</span>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        isActive ? 'border-[#0F4C81] bg-[#0F4C81]' : 'border-slate-200'
      }`}>
        {isActive && <CheckCircle2 size={14} className="text-white" />}
      </div>
    </button>
  );

  return (
    <div className="px-4 sm:px-8 flex flex-col h-full pb-40 pt-6">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={step === 5 ? () => setStep(1) : (step === 1 ? onBack : () => setStep(step - 1))}
          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 bg-white shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        {step < 5 && (
          <div className="flex-1 px-8">
            <Progress value={progress} className="h-1.5 bg-slate-100" />
          </div>
        )}
        <div className="w-10" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Pregnancy Status</h2>
                <p className="text-slate-500">How many weeks into your pregnancy are you?</p>
              </div>
              <Button
                variant="outline"
                className={`rounded-2xl w-12 h-12 flex items-center justify-center p-0 ${isListening ? 'bg-primary text-white animate-pulse' : 'text-primary'}`}
                onClick={simulateVoiceInput}
              >
                <Mic size={20} />
              </Button>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[3rem] items-center justify-center flex flex-col gap-4 border border-dashed border-slate-200">
               {isListening ? (
                 <div className="flex flex-col items-center gap-4 py-4">
                   <div className="flex gap-1 items-center">
                     {[1, 2, 3, 4].map(i => (
                       <motion.div 
                         key={i} 
                         animate={{ height: [10, 40, 10] }} 
                         transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                         className="w-1.5 bg-primary rounded-full"
                       />
                     ))}
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-primary">{t.voiceInput || 'Listening...'}</p>
                 </div>
               ) : (
                 <>
                   <div className="text-6xl font-black text-primary tracking-tighter">{formData.pregnancyWeek}</div>
                   <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Weeks</div>
                   <div className="flex gap-4 mt-4">
                      <Button variant="outline" className="rounded-2xl" onClick={() => setFormData(prev => ({...prev, pregnancyWeek: Math.max(1, prev.pregnancyWeek - 1)}))}>-</Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => setFormData(prev => ({...prev, pregnancyWeek: prev.pregnancyWeek + 1}))}>+</Button>
                   </div>
                 </>
               )}
            </div>

            <Button size="lg" className="mt-8 rounded-2xl h-12" onClick={() => setStep(2)}>
              Next Step
              <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pain & Discomfort</h2>
              <p className="text-slate-500">Please describe your current physical symptoms.</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Vaginal Hemorrhage / Active Bleeding Severity</label>
              {[
                { l: "Dry / Normal Discharge (No Bleeding)", v: 0 },
                { l: "Spotting / Light Bleeding (Less than a sanitary pad per 4 hours)", v: 1 },
                { l: "Moderate Active Bleeding (Soaking 1-2 pads per 4 hours, small clots)", v: 2 },
                { l: "Heavy Hemorrhage (Soaking a pad in under 1 hour or continuous flow)", v: 3 }
              ].map(opt => (
                <OptionCard 
                  key={opt.v}
                  label={opt.l} 
                  isActive={formData.bleeding === opt.v}
                  onClick={() => setFormData({...formData, bleeding: opt.v})}
                />
              ))}
            </div>

            <Button size="lg" className="mt-4 rounded-2xl h-12" onClick={() => setStep(3)}>
              Continue
              <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Other Indicators</h2>
              <p className="text-slate-500">Select any other symptoms you are experiencing.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'abdominalPain', label: 'Acute Severe Abdominal/Pelvic Pain (Sharp, localized or persistent)', icon: AlertTriangle },
                { id: 'dizziness', label: 'Syncope / Orthostatic Dizziness (Fainting episodes, lightheadedness)', icon: Info },
                { id: 'fever', label: 'Pyrexia / Elevated Temperature (Fever ≥ 38.0°C / 100.4°F or chills)', icon: HeartPulse },
                { id: 'hypertension', label: 'Severe Hypertension Indicators (Persistent headache, visual disturbance)', icon: Stethoscope }
              ].map(item => (
                <OptionCard 
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  isActive={formData[item.id as keyof typeof formData]}
                  onClick={() => setFormData({...formData, [item.id]: !formData[item.id as keyof typeof formData]})}
                />
              ))}
            </div>

            <Button size="lg" className="mt-4 rounded-2xl h-12 shadow-lg shadow-primary/20" onClick={() => setStep(4)}>
              Review Risk Factors
              <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Maternal History</h2>
              <p className="text-slate-500">Final check for hereditary or historic risks.</p>
            </div>

            <OptionCard 
              label="Prior Miscarriage History"
              isActive={formData.priorMiscarriage}
              onClick={() => setFormData({...formData, priorMiscarriage: !formData.priorMiscarriage})}
            />

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mt-2">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Shield className="text-secondary" size={18} />
                Medical Privacy
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your data is encrypted and anonymized. It will only be used to generate clinical routing intelligence for your safety.
              </p>
            </div>

            <Button 
              size="lg" 
              className="mt-4 rounded-2xl h-12 bg-secondary hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20"
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Analyzing Risk...
                </>
              ) : (
                <>
                  Generate AI Assessment
                  <ChevronRight size={20} />
                </>
              )}
            </Button>
          </motion.div>
        )}

        {step === 5 && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="text-center mb-6">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg relative ${
                result.riskLevel === RiskLevel.HIGH ? 'bg-rose-50 text-[#FF6B6B] shadow-red-100' :
                result.riskLevel === RiskLevel.MODERATE ? 'bg-orange-50 text-orange-500 shadow-orange-100' :
                'bg-emerald-50 text-emerald-500 shadow-emerald-100'
              }`}>
                <AlertTriangle size={48} />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black border-4 border-white"
                >
                  {result.riskScore}
                </motion.div>
              </div>
              <h2 className={`text-4xl font-black tracking-tight mb-2 ${
                result.riskLevel === RiskLevel.HIGH ? 'text-[#FF6B6B]' : 'text-slate-900'
              }`}>{result.riskLevel} Risk</h2>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Maternal Care Triage Result</p>
            </div>

            <Card className="p-8 border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden relative">
               {showEmergencyModal && (
                 <div className="absolute inset-0 z-50 bg-rose-50/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl animate-pulse">
                      <PhoneCall size={32} />
                    </div>
                    <h3 className="text-xl font-black text-rose-600 mb-2 uppercase tracking-tight">{t.emergencyEscalation}</h3>
                    <p className="text-rose-700/70 text-sm font-bold mb-8 leading-relaxed">
                      {t.notifyingClinic}
                    </p>
                    <div className="flex gap-2 items-center bg-white/50 px-4 py-2 rounded-full border border-rose-100 mb-8 animate-bounce">
                      <Bell size={14} className="text-rose-500" />
                      <span className="text-[10px] font-black uppercase text-rose-500">{t.clinicNotified}</span>
                    </div>
                    <Button 
                      className="w-full rounded-2xl h-12 bg-rose-600 text-white font-bold"
                      onClick={() => setShowEmergencyModal(false)}
                    >
                      Acknowledge
                    </Button>
                 </div>
               )}
               <div className="relative z-10">
                <div className="flex items-center gap-3 text-[#0F4C81] font-bold mb-4">
                    <Brain size={22} className="text-[#0F4C81]" />
                    <span className="text-lg">AI Clinical Insights</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium italic">
                  "{result.aiOutput.explanation}"
                </p>
                
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Explainable Logic</h4>
                <div className="space-y-2 mb-8">
                    {result.aiOutput.recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-3 items-center text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      {rec}
                      </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button size="lg" className="rounded-2xl h-12 bg-[#0F4C81] text-white font-bold" onClick={onComplete}>
                    Find Clinics
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-2xl h-12 border-slate-200 text-slate-600 font-bold" onClick={onBack}>
                    Home
                  </Button>
                </div>
               </div>
               
               {/* Decorative watermark */}
               <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12">
                  <ShieldCheck size={200} />
               </div>
            </Card>

            <div className="p-6 bg-slate-100/50 rounded-[2rem] border border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                  This assessment is for triage intelligence only and does not replace a clinical examination. In case of emergency, proceed to the nearest hospital immediately.
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

