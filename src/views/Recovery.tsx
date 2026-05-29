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
  AlertTriangle,
  Flame,
  Coffee,
  CheckCircle2,
  X
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

  // Modal Assessment Wizard States
  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState<number | 'intro'>('intro');

  // Daily Streak & Vitals States
  const [streak, setStreak] = useState(5);
  const [waterGlasses, setWaterGlasses] = useState(2);
  const [mealEaten, setMealEaten] = useState(false);
  const [medTaken, setMedTaken] = useState(false);

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
  const runRiskAssessment = async (silent = false) => {
    setAssessing(true);
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let reasonText = '';
    let apiSuccess = false;

    // 1. Prepare Local Risk Logic to determine backup
    let localRisk: 'low' | 'moderate' | 'high' = 'low';
    let localReasonText = '';
    if (
      healthCheck.bleedingSeverity === 'heavy' ||
      healthCheck.soakingPads ||
      healthCheck.fainting ||
      healthCheck.painLevel === 'severe' ||
      healthCheck.fever
    ) {
      localRisk = 'high';
      const concerns = [];
      if (healthCheck.bleedingSeverity === 'heavy' || healthCheck.soakingPads) concerns.push("hemorrhaging indicators (heavy bleeding or soaking pads)");
      if (healthCheck.fainting) concerns.push("fainting episodes");
      if (healthCheck.painLevel === 'severe') concerns.push("severe abdominal pain");
      if (healthCheck.fever) concerns.push("fever (potential systemic infection)");
      
      localReasonText = `Critical recovery indicators detected: ${concerns.join(', ')}. There is an elevated risk of severe post-pregnancy loss complications (e.g. retained products of conception, infection, or internal bleeding). Immediate medical attention is recommended.`;
    } else if (
      healthCheck.bleedingSeverity === 'moderate' ||
      healthCheck.painLevel === 'moderate' ||
      healthCheck.dizzy ||
      healthCheck.weakness ||
      healthCheck.chills ||
      healthCheck.foulDischarge ||
      healthCheck.prevEctopic
    ) {
      localRisk = 'moderate';
      const concerns = [];
      if (healthCheck.bleedingSeverity === 'moderate') concerns.push("moderate bleeding");
      if (healthCheck.painLevel === 'moderate') concerns.push("moderate pain/cramping");
      if (healthCheck.dizzy || healthCheck.weakness) concerns.push("dizziness or physical weakness");
      if (healthCheck.foulDischarge) concerns.push("abnormal discharge");
      if (healthCheck.prevEctopic) concerns.push("previous ectopic pregnancy");

      localReasonText = `Some recovery concerns flagged: ${concerns.join(', ')}. While not in acute distress, we advise booking a follow-up assessment with Lagos Maternal Center within 24 to 48 hours to ensure complete recovery.`;
    } else {
      localRisk = 'low';
      localReasonText = "Your recovery parameters appear stable. No primary red flags (such as hemorrhaging, high fever, or loss of consciousness) are present. Continue monitoring daily, rest, and keep hydrated.";
    }

    // 2. Call the EPL Care AI predict endpoint
    let apiData: any = null;
    try {
      const patientData = {
        province: "Lagos",
        county: "Unknown",
        district: "Unknown",
        type: "Health Centre",
        pds101: 25.0,
        pds102: "Urban",
        pds103: "Married",
        pds104: "Complete Secondary",
        pds105: "Other Christian",
        pds106: "Farming",
        pds208: "Yes, wanted then",
        pds301: "Postabortion Care",
        pds302: 8.0,
        pds303: (healthCheck.abortionProcedure || healthCheck.prevMiscarriage) ? "Yes" : "No",
        pds310: healthCheck.fever ? "Yes" : "No",
        pds324: "<=12 weeks",
        pds401: "Incomplete Abortion",
        pds402: (healthCheck.fainting || healthCheck.foulDischarge || healthCheck.soakingPads || healthCheck.painLevel === 'severe') ? "Yes" : "No",
        pds501: "Yes",
        pds502: "MVA",
        pds503: "Clinical Officer",
        pds505: "Yes",
        pds507: "Yes",
        pds509: "No",
        pds510: "No",
        pds701: "Yes",
        pds702: "Yes",
        pds801: (healthCheck.fainting || healthCheck.soakingPads || healthCheck.painLevel === 'severe') ? "Referred / Admitted" : "Discharged well",
        pds802: "Less than 12 Hrs",
        ses_score: 3.0,
        mental_health_risk: (mood !== null && mood <= 2) ? 1 : 0,
        care_delay: 0,
        hf215: "Unknown",
        hf303: "Unknown",
        hf305a: "Unknown",
        hf308: "Unknown",
        hf310a: "Unknown",
        hf401: "Unknown",
        hf402a: "Unknown",
        hf405: "Unknown",
        hf407: "Unknown",
        pac_jan: 0.0,
        pac_feb: 0.0,
        pac_mar: 0.0,
        pac_apr: 0.0,
        pac_may: 0.0,
        pac_jun: 0.0,
        pac_jul: 0.0,
        pac_aug: 0.0,
        pac_sep: 0.0,
        pac_oct: 0.0,
        pac_nov: 0.0,
        pac_dec: 0.0
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch("https://gharnie.pythonanywhere.com/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patientData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const predVal = Array.isArray(result.prediction) ? result.prediction[0] : result.prediction;
        const probVal = Array.isArray(result.probability) ? result.probability[0] : result.probability;
        
        const rawRisk = result.risk_level || result.risk || "";
        const rawRiskStr = String(rawRisk).toLowerCase();
        
        if (rawRiskStr.includes("high") || rawRiskStr.includes("3") || rawRiskStr === "2") {
          riskLevel = "high";
        } else if (rawRiskStr.includes("moderate") || rawRiskStr.includes("medium") || rawRiskStr.includes("1") || rawRiskStr.includes("some")) {
          riskLevel = "moderate";
        } else {
          riskLevel = "low";
        }
        
        apiSuccess = true;
        
        apiData = {
          action: result.action || "Confirm follow-up clinical checks.",
          careGaps: result.care_gaps || [],
          equityFlags: result.equity_flags || [],
          mentalHealthFlag: result.mental_health_flag || false,
          mentalHealthNote: result.mental_health_note || "No immediate mental health concerns.",
          followUpRecommendation: result.follow_up_recommendation || "Schedule follow-up within 1-2 weeks.",
          prediction: predVal,
          probability: probVal
        };
        
        reasonText = apiData.followUpRecommendation || result.action || "";
      } else {
        console.warn(`EPL Care AI returned non-OK status: ${response.status}. Falling back to rule engine.`);
      }
    } catch (e) {
      console.warn("EPL Care AI predict API error, falling back to local rule-based assessment:", e);
    }

    // 3. Apply backup if API call failed
    if (!apiSuccess) {
      riskLevel = localRisk;
      reasonText = localReasonText;
      
      const isHigh = riskLevel === 'high';
      const isMod = riskLevel === 'moderate';
      
      apiData = {
        action: isHigh ? "Escalate immediately to clinical coordinator. Arrange transport." : (isMod ? "Schedule follow-up appointment within 48 hours." : "Provide standard recovery counselling."),
        careGaps: isHigh ? ["Critical symptom presentation requires urgent referral note", "Emergency contact verification needed"] : [],
        equityFlags: [],
        mentalHealthFlag: (mood !== null && mood <= 2),
        mentalHealthNote: (mood !== null && mood <= 2) ? "Patient flags emotional distress. Support group referral recommended." : "No immediate mental health risks flagged.",
        followUpRecommendation: isHigh ? "Immediate transfer or emergency check-in." : (isMod ? "Follow-up check within 2 days." : "Routine follow-up in 1 week."),
        prediction: isHigh ? 1 : 0,
        probability: isHigh ? 0.95 : 0.45
      };
    }

    const updatedResult = {
      risk: riskLevel,
      text: reasonText,
      action: apiData.action,
      careGaps: apiData.careGaps,
      equityFlags: apiData.equityFlags,
      mentalHealthFlag: apiData.mentalHealthFlag,
      mentalHealthNote: apiData.mentalHealthNote,
      prediction: apiData.prediction,
      probability: apiData.probability
    };

    setAssessmentResult(updatedResult);

    // Save patient record in local registry if CHW Mode is active
    if (prefs.chwMode) {
      try {
        const id = `P-${Math.floor(1000 + Math.random() * 9000)}`;
        const newPatient = {
          id,
          name: `Patient ${id}`,
          age: 25,
          location: "Lagos",
          date: new Date().toLocaleDateString(),
          riskLevel: riskLevel === 'high' ? 'High' : (riskLevel === 'moderate' ? 'Medium' : 'Low'),
          prediction: apiData.prediction,
          probability: apiData.probability,
          action: apiData.action,
          careGaps: apiData.careGaps,
          equityFlags: apiData.equityFlags,
          mentalHealthFlag: apiData.mentalHealthFlag,
          mentalHealthNote: apiData.mentalHealthNote,
          followUpRecommendation: apiData.followUpRecommendation
        };
        const currentRaw = localStorage.getItem("chw_patients");
        const list = currentRaw ? JSON.parse(currentRaw) : [];
        list.unshift(newPatient);
        localStorage.setItem("chw_patients", JSON.stringify(list));
      } catch (err) {
        console.error("Failed to save CHW patient to local storage:", err);
      }
    }

    setAssessing(false);
    
    if (!silent) {
      speakText(`Health check completed. Risk level is ${riskLevel}. ${reasonText}`);
    }
  };

  const getDynamicTips = () => {
    const risk = assessmentResult?.risk || 'none';
    if (risk === 'high') {
      return [
        { title: "Avoid physical exertion", text: "Complete bed rest is required. Avoid lifting anything heavier than a cup." },
        { title: "Avoid hot baths", text: "Stick to warm showers. Heat can exacerbate bleeding." },
        { title: "Drink warm broth", text: "Support hydration and electrolytes without chilling your stomach core." }
      ];
    } else if (risk === 'moderate') {
      return [
        { title: "Hydrate & Restore", text: "Aim for 8 to 10 glasses of water. Supporting blood volume recovery is critical." },
        { title: "Eat iron-rich meals", text: "Incorporate spinach, beans, and eggs to replenish red blood cells." },
        { title: "Avoid sexual activity", text: "Do not insert anything in the vagina to prevent pelvic infection risks." }
      ];
    } else {
      return [
        { title: "Streak maintenance", text: "Continue tracking water. 8 glasses a day supports tissue healing." },
        { title: "Calorie density", text: "Consume at least 2,000 nutrients-packed calories daily to rebuild tissue energy." },
        { title: "Gentle breathing", text: "Practice diaphragmatic breaths for 5 minutes morning and night." }
      ];
    }
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
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.bleedingSeverity === opt ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.soakingPads === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.bloodClots === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.painLevel === opt ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.cramping === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.oneSidedPain === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.fainting === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.dizzy === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.weakness === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.prevMiscarriage === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.prevEctopic === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.fever === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.chills === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.foulDischarge === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.abortionProcedure === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.recentMedication === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                className={`py-2 px-3 text-xs font-black rounded-xl border transition-all ${healthCheck[cond.k as keyof typeof healthCheck] ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{t.recovery}</h2>
          <p className="text-xs text-slate-500">Post-loss reproductive symptoms, healing check-ins & monitoring.</p>
        </div>
        <Badge variant="outline" className="bg-[#0F4C81]/5 text-[#0F4C81] border-[#0F4C81]/20 font-black tracking-widest text-[9px] uppercase py-1 px-3 rounded-full flex items-center gap-1">
          <Flame size={12} className="text-orange-500 fill-orange-500 animate-pulse" />
          {streak} Day Streak
        </Badge>
      </div>

      {/* Responsive Streak & Daily Vitals check-in Panel */}
      <Card className="p-5 border border-slate-100 rounded-[2rem] bg-white shadow-sm mb-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Daily Care & Vitals Check-in
          </h4>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Today's Vitals</span>
        </div>

        <div className="space-y-3.5">
          {/* Water Tracker */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Droplets size={14} className="text-blue-500" /> Have you taken water?
            </span>
            <div className="flex gap-1 items-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(glass => (
                <button
                  key={glass}
                  onClick={() => setWaterGlasses(glass)}
                  className={`w-6 h-6.5 text-xs font-black rounded-md flex items-center justify-center transition-all ${
                    waterGlasses >= glass 
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-200' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                  }`}
                  title={`${glass} Glass`}
                >
                  🥛
                </button>
              ))}
              <span className="text-[10px] font-black text-slate-400 ml-1">{waterGlasses}/8</span>
            </div>
          </div>

          {/* Meals & Calories Tracker */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50 pt-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Coffee size={14} className="text-amber-600" /> Taken nutrient meals today?
            </span>
            <div className="flex gap-1.5">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => {
                    setMealEaten(val);
                    if (val) setStreak(p => p + 1);
                  }}
                  className={`py-1 px-3 text-[10px] font-black uppercase rounded-lg border transition-all ${
                    mealEaten === val && val 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100' 
                      : (mealEaten === val && !val 
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-100' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                  }`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Prescribed supplements */}
          <div className="flex items-center justify-between py-1 border-t border-slate-50 pt-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Pill size={14} className="text-purple-600" /> Prescribed vitamins / meds taken?
            </span>
            <div className="flex gap-1.5">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  onClick={() => setMedTaken(val)}
                  className={`py-1 px-3 text-[10px] font-black uppercase rounded-lg border transition-all ${
                    medTaken === val && val 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100' 
                      : (medTaken === val && !val 
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-100' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                  }`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Advice/Tips Section based on AI Assessment */}
        <div className="mt-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
            <Sparkles size={13} className="text-secondary" />
            AI Recovery Advice & Tips
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {getDynamicTips().map((tip, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                <span className="block font-black text-slate-800 text-[10.5px] uppercase tracking-wide mb-0.5">{tip.title}</span>
                <span className="block text-[10.5px] text-slate-500 leading-normal font-medium">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

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
            <Button
              onClick={() => { setShowModal(true); setModalStep('intro'); }}
              variant="outline"
              className="rounded-xl font-bold text-[10px] uppercase h-9 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Launch Assessment Flow
            </Button>
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
            onClick={() => runRiskAssessment(false)}
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
                <p className="text-xs leading-relaxed mb-4 font-bold text-slate-800">
                  {assessmentResult.text}
                </p>

                {/* Follow-up Likelihood Indicator */}
                {assessmentResult.prediction !== undefined && assessmentResult.probability !== undefined && (
                  <div className="mt-4 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Follow-up Likelihood</span>
                      <span className={assessmentResult.prediction === 1 ? "text-emerald-600" : "text-amber-600"}>
                        {assessmentResult.prediction === 1 ? 'Likely' : 'Unlikely'} ({Math.round(assessmentResult.probability * 100)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${assessmentResult.prediction === 1 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${assessmentResult.probability * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Clinical Action Notice */}
                {assessmentResult.action && (
                  <div className="mt-3 p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1.5 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Clinical Action Required</span>
                    <p className="text-[11px] font-medium leading-normal">{assessmentResult.action}</p>
                  </div>
                )}

                {/* Care Gaps */}
                {assessmentResult.careGaps && assessmentResult.careGaps.length > 0 && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200/40 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">⚠️ Identified Care Gaps ({assessmentResult.careGaps.length})</span>
                    <ul className="space-y-1.5">
                      {assessmentResult.careGaps.map((gap: string, i: number) => (
                        <li key={i} className="text-[10.5px] font-bold text-amber-900 leading-normal flex items-start gap-2">
                          <span className="shrink-0 text-amber-500">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Equity Barriers */}
                {assessmentResult.equityFlags && assessmentResult.equityFlags.length > 0 && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200/40 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black text-[#0F4C81] uppercase tracking-wider block">📍 Equity Barriers Detected</span>
                    <ul className="space-y-1.5">
                      {assessmentResult.equityFlags.map((flag: string, i: number) => (
                        <li key={i} className="text-[10.5px] font-bold text-slate-700 leading-normal flex items-start gap-2">
                          <span className="shrink-0 text-primary">•</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mental Health Flag */}
                {assessmentResult.mentalHealthFlag && (
                  <div className="mt-3 p-4 bg-purple-50 border border-purple-200/40 rounded-2xl space-y-2 mb-4">
                    <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">🧠 Mental Health Support Flagged</span>
                    <p className="text-[11px] font-bold text-purple-900 leading-normal">{assessmentResult.mentalHealthNote}</p>
                    <button 
                      onClick={() => alert("Connecting to CareBridge counseling support services...")}
                      className="mt-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Connect to Counselor
                    </button>
                  </div>
                )}

                {/* WhatsApp follow-up checkbox */}
                <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 flex items-center gap-3 mt-4">
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

      {/* Onboarding Dialog / Modal Assessment Flow */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white rounded-[2.5rem] p-6 max-w-md w-full shadow-2xl border border-slate-100 z-10 overflow-hidden flex flex-col gap-6"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
              >
                <X size={18} />
              </button>

              {modalStep === 'intro' ? (
                <div className="space-y-6 text-center pt-4">
                  <div className="w-16 h-16 bg-[#0F4C81]/10 rounded-[1.5rem] flex items-center justify-center text-[#0F4C81] mx-auto shadow-inner">
                    <HeartPulse size={36} className="animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recovery Symptom Screening</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      CareBridge AI recommends running a recovery health test to verify post-loss healing, screen warning signs, and activate emergency clinical care coordinates if needed.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <Button 
                      onClick={() => setModalStep(0)}
                      className="w-full h-11 bg-[#0F4C81] hover:bg-[#0F4C81]/95 text-white font-extrabold rounded-2xl uppercase tracking-wider text-[11px]"
                    >
                      Start Recovery Test
                    </Button>
                    <Button
                      onClick={() => {
                        runRiskAssessment(true);
                        setShowModal(false);
                      }}
                      variant="outline"
                      className="w-full h-11 border-slate-200 text-[#0F4C81] font-extrabold rounded-2xl uppercase tracking-wider text-[11px]"
                    >
                      Direct AI Assessment
                    </Button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider mt-1 transition-colors"
                    >
                      Take Test Later
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Step {modalStep + 1} of 7</span>
                      <h4 className="text-base font-black text-[#0F4C81]">{sections[modalStep].title}</h4>
                    </div>
                    <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold uppercase text-[9px]">
                      Health Test
                    </Badge>
                  </div>

                  {/* Progressive indicator */}
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-1 bg-[#0F4C81] rounded-full transition-all duration-300" 
                      style={{ width: `${((modalStep + 1) / 7) * 100}%` }}
                    />
                  </div>

                  {/* Section questions */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 min-h-[160px] flex flex-col justify-center">
                    {sections[modalStep].content}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-2">
                    {modalStep > 0 && (
                      <Button
                        onClick={() => setModalStep(modalStep - 1)}
                        variant="outline"
                        className="flex-1 h-10 border-slate-200 text-slate-600 font-extrabold rounded-xl uppercase tracking-wider text-[10px]"
                      >
                        Back
                      </Button>
                    )}
                    {modalStep < 6 ? (
                      <Button
                        onClick={() => setModalStep(modalStep + 1)}
                        className="flex-1 h-10 bg-[#0F4C81] hover:bg-[#0F4C81]/95 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px]"
                      >
                        Next Step
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          runRiskAssessment(false);
                          setShowModal(false);
                        }}
                        className="flex-1 h-10 bg-secondary hover:bg-secondary/90 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] shadow-lg shadow-secondary/20"
                      >
                        Submit Test
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
