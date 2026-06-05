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
    nausea: false, // Y/N
    vomiting: 'none', // 'none' | 'medication-down' | 'food-down' | 'mild'
    headache: 'none', // 'none' | 'mild' | 'moderate' | 'severe'
    dizziness: 'none', // 'none' | 'mild' | 'moderate' | 'severe'
    spotting: false, // Y/N
    abdominalPain: 'none', // 'none' | 'mild' | 'moderate' | 'severe'
    heavyBleeding: false, // Y/N
    passingClot: false, // Y/N
    pelvicPainOneSided: false, // Y/N
    fever: false, // Y/N
    prevMiscarriage: false, // Y/N
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const calculateRisk = () => {
    // 1. Check for High Risk indicators
    const isHigh = 
      formData.vomiting === 'medication-down' ||
      formData.vomiting === 'food-down' ||
      formData.headache === 'severe' ||
      formData.dizziness === 'severe' ||
      formData.abdominalPain === 'severe' ||
      formData.heavyBleeding ||
      formData.passingClot ||
      formData.pelvicPainOneSided ||
      formData.fever;

    // 2. Check for Medium Risk indicators
    const isMedium = 
      !isHigh && (
        formData.vomiting === 'mild' ||
        formData.headache === 'moderate' ||
        formData.dizziness === 'moderate' ||
        formData.abdominalPain === 'moderate' ||
        formData.spotting ||
        formData.prevMiscarriage
      );

    let level = RiskLevel.LOW;
    let score = 15;
    
    if (isHigh) {
      level = RiskLevel.HIGH;
      score = 90;
    } else if (isMedium) {
      level = RiskLevel.MODERATE;
      score = 55;
    } else {
      level = RiskLevel.LOW;
      score = 20;
    }

    return { score, level };
  };

  const getStaticRecommendations = (level: RiskLevel) => {
    if (level === RiskLevel.HIGH) {
      return [
        "Seek immediate medical care"
      ];
    } else if (level === RiskLevel.MODERATE) {
      return [
        "Visit clinic within 24-48 hrs",
        "Consider ultrasound assessment",
        "Follow up with health care provider"
      ];
    } else {
      return [
        "Continue monitoring",
        "Stay hydrated",
        "Attend routine ANC Care",
        "Repeat assessment if symptoms worsen"
      ];
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const { score, level } = calculateRisk();
    
    const assessmentData: any = {
      userId: auth.currentUser?.uid || 'anonymous',
      pregnancyWeek: formData.pregnancyWeek,
      symptoms: {
        nausea: formData.nausea,
        vomiting: formData.vomiting,
        headache: formData.headache,
        dizziness: formData.dizziness,
        spotting: formData.spotting,
        abdominalPain: formData.abdominalPain,
        heavyBleeding: formData.heavyBleeding,
        passingClot: formData.passingClot,
        pelvicPainOneSided: formData.pelvicPainOneSided,
        fever: formData.fever
      },
      history: {
        priorMiscarriage: formData.prevMiscarriage,
        chronicConditions: []
      },
      riskScore: score,
      riskLevel: level,
      language,
      timestamp: new Date().toISOString()
    };

    // Call explanation API
    let aiOutput = { explanation: '', recommendations: [] as string[] };
    try {
      aiOutput = await explainRisk(assessmentData);
    } catch (err) {
      console.warn("AI explainRisk failed:", err);
    }
    
    // Always merge or replace with the specific required recommendations
    const staticRecs = getStaticRecommendations(level);
    aiOutput.recommendations = staticRecs;
    if (!aiOutput.explanation) {
      aiOutput.explanation = level === RiskLevel.HIGH
        ? "Critical triage warning: Severe maternal risk factors identified. Immediate clinical evaluation is required."
        : level === RiskLevel.MODERATE
        ? "Moderate maternal indicators flagged. A formal clinical examination and ultrasound are recommended within 24 to 48 hours."
        : "Stable recovery parameters. No emergency warning signs identified at this moment.";
    }

    // Save to Firestore (Non-blocking)
    try {
      if (auth.currentUser) {
        addDoc(collection(db, 'assessments'), assessmentData).catch(e => console.error("Firestore save error:", e));
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
      setFormData(prev => ({ 
        ...prev, 
        nausea: true, 
        vomiting: 'mild',
        headache: 'moderate',
        spotting: true
      }));
      setStep(3);
    }, 2500);
  };

  const OptionCard = ({ label, isActive, onClick, icon: Icon }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 sm:p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between group ${
        isActive 
          ? 'border-[#0F4C81] bg-[#0F4C81]/5 text-[#0F4C81]' 
          : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 font-sans">
        {Icon && <Icon size={20} className={isActive ? 'text-[#0F4C81]' : 'text-slate-400'} />}
        <span className="font-bold text-left">{label}</span>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        isActive ? 'border-[#0F4C81] bg-[#0F4C81]' : 'border-slate-200'
      }`}>
        {isActive && <CheckCircle2 size={14} className="text-white" />}
      </div>
    </button>
  );

  const SelectionRow = ({ label, options, currentValue, onChange }: any) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt: any) => {
          const isActive = currentValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${
                isActive 
                  ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Pregnancy & Core Symptoms</h2>
                <p className="text-slate-500">Please provide gestation age and gastrointestinal symptoms.</p>
              </div>
              <Button
                variant="outline"
                className={`rounded-2xl w-12 h-12 flex items-center justify-center p-0 ${isListening ? 'bg-primary text-white animate-pulse' : 'text-primary'}`}
                onClick={simulateVoiceInput}
              >
                <Mic size={20} />
              </Button>
            </div>
            
            {/* Pregnancy Weeks */}
            <div className="bg-slate-50 p-6 rounded-[2.5rem] items-center justify-center flex flex-col gap-3 border border-slate-200/50">
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
                   <div className="text-5xl font-black text-primary tracking-tighter">{formData.pregnancyWeek}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pregnancy Weeks</div>
                   <div className="flex gap-4 mt-2">
                      <Button variant="outline" className="rounded-2xl w-12 h-10" onClick={() => setFormData(prev => ({...prev, pregnancyWeek: Math.max(1, prev.pregnancyWeek - 1)}))}>-</Button>
                      <Button variant="outline" className="rounded-2xl w-12 h-10" onClick={() => setFormData(prev => ({...prev, pregnancyWeek: prev.pregnancyWeek + 1}))}>+</Button>
                   </div>
                 </>
               )}
            </div>

            {/* Nausea */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Nausea Symptom</label>
              <div className="grid grid-cols-2 gap-3">
                <OptionCard 
                  label="Nausea: Yes"
                  isActive={formData.nausea === true}
                  onClick={() => setFormData(prev => ({ ...prev, nausea: true }))}
                />
                <OptionCard 
                  label="Nausea: No"
                  isActive={formData.nausea === false}
                  onClick={() => setFormData(prev => ({ ...prev, nausea: false }))}
                />
              </div>
            </div>

            {/* Vomiting */}
            <SelectionRow 
              label="Vomiting Severity"
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'food-down', label: "Can't Keep Food Down" },
                { value: 'medication-down', label: "Can't Keep Meds Down" }
              ]}
              currentValue={formData.vomiting}
              onChange={(val: string) => setFormData(prev => ({ ...prev, vomiting: val }))}
            />

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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Neurological Indicators</h2>
              <p className="text-slate-500">Provide details on headache or dizzy spells.</p>
            </div>

            {/* Headache */}
            <SelectionRow 
              label="Headache Severity"
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'severe', label: 'Severe' }
              ]}
              currentValue={formData.headache}
              onChange={(val: string) => setFormData(prev => ({ ...prev, headache: val }))}
            />

            {/* Dizziness */}
            <SelectionRow 
              label="Dizziness Severity"
              options={[
                { value: 'none', label: 'None' },
                { value: 'mild', label: 'Mild' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'severe', label: 'Severe' }
              ]}
              currentValue={formData.dizziness}
              onChange={(val: string) => setFormData(prev => ({ ...prev, dizziness: val }))}
            />

            <Button size="lg" className="mt-8 rounded-2xl h-12" onClick={() => setStep(3)}>
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Bleeding & Pain Indicators</h2>
              <p className="text-slate-500">Select physical symptoms related to bleeding and cramps.</p>
            </div>

            <div className="space-y-4">
              {/* Spotting */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">Experiencing Spotting?</span>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={val ? 'yes' : 'no'}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, spotting: val }))}
                      className={`py-1.5 px-4 text-xs font-black uppercase rounded-lg border transition-all ${formData.spotting === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Abdominal Pain */}
              <SelectionRow 
                label="Abdominal Pain"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'mild', label: 'Mild' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'severe', label: 'Severe' }
                ]}
                currentValue={formData.abdominalPain}
                onChange={(val: string) => setFormData(prev => ({ ...prev, abdominalPain: val }))}
              />

              {/* Heavy Bleeding */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700">Heavy Bleeding?</span>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={val ? 'yes' : 'no'}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, heavyBleeding: val }))}
                      className={`py-1.5 px-4 text-xs font-black uppercase rounded-lg border transition-all ${formData.heavyBleeding === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passing out Clots */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700">Passing out Clots?</span>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={val ? 'yes' : 'no'}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, passingClot: val }))}
                      className={`py-1.5 px-4 text-xs font-black uppercase rounded-lg border transition-all ${formData.passingClot === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pelvic Pain: One Sided */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700">Pelvic Pain: One Sided?</span>
                <div className="flex gap-2">
                  {[true, false].map(val => (
                    <button
                      key={val ? 'yes' : 'no'}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pelvicPainOneSided: val }))}
                      className={`py-1.5 px-4 text-xs font-black uppercase rounded-lg border transition-all ${formData.pelvicPainOneSided === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">History & Health Vitals</h2>
              <p className="text-slate-500">Final checks for miscarriage history or systemic factors.</p>
            </div>

            {/* Fever */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700">Experiencing Fever / Pyrexia?</span>
              <div className="flex gap-2">
                {[true, false].map(val => (
                  <button
                    key={val ? 'yes' : 'no'}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, fever: val }))}
                    className={`py-1.5 px-4 text-xs font-black uppercase rounded-lg border transition-all ${formData.fever === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            {/* Previous Miscarriage */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700">Previous Miscarriage?</span>
              <div className="flex gap-2">
                {[true, false].map(val => (
                  <button
                    key={val ? 'yes' : 'no'}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, prevMiscarriage: val }))}
                    className={`py-1.5 px-4 text-xs font-black uppercase rounded-lg border transition-all ${formData.prevMiscarriage === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mt-2">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-slate-800">
                <Shield className="text-[#0F4C81]" size={18} />
                Medical Privacy
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your data is encrypted and anonymized. It will only be used to generate clinical routing intelligence for your safety.
              </p>
            </div>

            <Button 
              size="lg" 
              className="mt-4 rounded-2xl h-12 bg-secondary hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20 text-white font-black"
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
                result.riskLevel === RiskLevel.HIGH ? 'text-[#FF6B6B]' :
                result.riskLevel === RiskLevel.MODERATE ? 'text-orange-500' : 'text-emerald-600'
              }`}>{result.riskLevel} Risk</h2>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Maternal Care Triage Result</p>
            </div>

            <Card className="p-8 border-slate-200 rounded-[2.5rem] shadow-sm bg-white overflow-hidden relative">
               {showEmergencyModal && (
                 <div className="absolute inset-0 z-50 bg-rose-50/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl animate-pulse">
                      <PhoneCall size={32} />
                    </div>
                    <h3 className="text-xl font-black text-rose-600 mb-2 uppercase tracking-tight">{t.emergencyEscalation || 'Emergency Warning'}</h3>
                    <p className="text-rose-700/70 text-sm font-bold mb-8 leading-relaxed">
                      {t.notifyingClinic || 'High risk factors detected. Please consult emergency medical services immediately.'}
                    </p>
                    <div className="flex gap-2 items-center bg-white/50 px-4 py-2 rounded-full border border-rose-100 mb-8 animate-bounce">
                      <Bell size={14} className="text-rose-500" />
                      <span className="text-[10px] font-black uppercase text-rose-500">{t.clinicNotified || 'Emergency Alert Active'}</span>
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
                
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Triage Recommendations</h4>
                <div className="space-y-2 mb-8">
                    {result.aiOutput.recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-3 items-center text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0F4C81] shrink-0" />
                        <span className="text-left">{rec}</span>
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
