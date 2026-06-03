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
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateSupportMessage } from '../lib/gemini';
import { Language, UserPreferences, UserSession } from '../types';
import { translations } from '../translations';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface RecoveryProps {
  language: Language;
  prefs: UserPreferences;
  onPrefsChange: (prefs: Partial<UserPreferences>) => void;
  session?: UserSession;
  onBack?: () => void;
}

export function Recovery({ language, prefs, onPrefsChange, session, onBack }: RecoveryProps) {
  const t = translations[language] || translations['en'];
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
  const [lastAssessmentId, setLastAssessmentId] = useState<string | null>(null);
  const [assignedCHW, setAssignedCHW] = useState<string | null>(null);

  const assignCHW = async (chwId: string, chwName: string) => {
    try {
      setAssignedCHW(chwName);
      if (lastAssessmentId) {
        const assessmentRef = doc(db, 'assessments', lastAssessmentId);
        await updateDoc(assessmentRef, { assignedCHWId: chwId });
      }
      await addDoc(collection(db, 'notifications'), {
        chwId: chwId,
        patientName: session?.username || "Tomi",
        riskLevel: assessmentResult?.risk === 'high' ? 'High' : 'Medium',
        message: `New case: Patient ${session?.username || "Tomi"} flagged as ${assessmentResult?.risk ? assessmentResult.risk.toUpperCase() : 'HIGH'} risk. Immediate follow-up required.`,
        readStatus: false,
        timestamp: new Date().toISOString()
      });
      alert(`Notification sent: CHW ${chwName} has been assigned to follow up on your case.`);
    } catch (err) {
      console.warn("Failed to assign CHW on Firestore:", err);
      alert(`CHW ${chwName} has been assigned (offline simulation).`);
    }
  };

  // Modal Assessment Wizard States
  const [showModal, setShowModal] = useState(true);
  const [modalStep, setModalStep] = useState<number | 'intro'>('intro');

  // Daily Streak & Vitals States
  const [streak, setStreak] = useState(5);
  const [waterGlasses, setWaterGlasses] = useState(2);
  const [mealEaten, setMealEaten] = useState(false);
  const [medTaken, setMedTaken] = useState(false);

  const [healthCheck, setHealthCheck] = useState({
    pregnancyWeek: 8,
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

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const availableTags = ['Bleeding', 'Pelvic Pain', 'Headache', 'Fever', 'Nausea', 'Fatigue'];

  const scanSymptomKeywords = (text: string) => {
    const lower = text.toLowerCase();
    const suggested: string[] = [];
    if (lower.includes('bleed') || lower.includes('blood') || lower.includes('spot')) suggested.push('Bleeding');
    if (lower.includes('pain') || lower.includes('cramp') || lower.includes('ache') || lower.includes('stomach')) suggested.push('Pelvic Pain');
    if (lower.includes('head') || lower.includes('migrain')) suggested.push('Headache');
    if (lower.includes('fever') || lower.includes('temp') || lower.includes('hot') || lower.includes('chill')) suggested.push('Fever');
    if (lower.includes('sick') || lower.includes('vomit') || lower.includes('nause')) suggested.push('Nausea');
    if (lower.includes('tired') || lower.includes('weak') || lower.includes('fatig') || lower.includes('exhaust')) suggested.push('Fatigue');
    return suggested;
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
    const scanned = scanSymptomKeywords(val);
    setSelectedTags(prev => {
      const uniqueScanned = scanned.filter(t => !prev.includes(t));
      return [...prev, ...uniqueScanned];
    });
  };

  const handleLog = async () => {
    if (mood === null) return;
    setLoading(true);

    // Save to Firestore symptom_logs collection
    try {
      await addDoc(collection(db, 'symptom_logs'), {
        patientName: session?.username || "Tomi",
        timestamp: new Date().toISOString(),
        mood: mood,
        note: note,
        tags: selectedTags
      });
    } catch (err) {
      console.warn("Failed to save daily symptom log to Firestore:", err);
    }

    const msg = await generateSupportMessage(mood, note);
    setSupportMessage(msg);
    setLoading(false);
  };

  const handleLogSymptomsDirectly = async (logMood: number, logNote: string, logTags: string[]) => {
    setMood(logMood);
    setNote(logNote);
    setSelectedTags(logTags);
    setLoading(true);

    try {
      await addDoc(collection(db, 'symptom_logs'), {
        patientName: session?.username || "Tomi",
        timestamp: new Date().toISOString(),
        mood: logMood,
        note: logNote,
        tags: logTags
      });
    } catch (err) {
      console.warn("Failed to save daily symptom log to Firestore:", err);
    }

    const msg = await generateSupportMessage(logMood, logNote);
    setSupportMessage(msg);
    setLoading(false);
  };

  React.useEffect(() => {
    const handleCareBridgeAction = (e: Event) => {
      const { type, data } = (e as CustomEvent).detail;
      if (type === 'LOG_SYMPTOMS') {
        const logMood = data?.mood || 3;
        const logNote = data?.note || "";
        const logTags = data?.tags || [];
        handleLogSymptomsDirectly(logMood, logNote, logTags);
      } else if (type === 'RUN_ASSESSMENT') {
        const updatedCheck = {
          pregnancyWeek: data?.pregnancyWeek !== undefined ? Number(data.pregnancyWeek) : 8,
          bleedingSeverity: data?.bleedingSeverity || 'none',
          soakingPads: !!data?.soakingPads,
          bloodClots: !!data?.bloodClots,
          cramping: !!data?.cramping,
          oneSidedPain: !!data?.oneSidedPain,
          painLevel: data?.painLevel || 'none',
          fainting: !!data?.fainting,
          dizzy: !!data?.dizzy,
          weakness: !!data?.weakness,
          prevMiscarriage: !!data?.prevMiscarriage,
          prevEctopic: !!data?.prevEctopic,
          fever: !!data?.fever,
          chills: !!data?.chills,
          foulDischarge: !!data?.foulDischarge,
          abortionProcedure: !!data?.abortionProcedure,
          recentMedication: !!data?.recentMedication,
          hypertension: !!data?.hypertension,
          diabetes: !!data?.diabetes,
          anemia: !!data?.anemia,
          otherConditions: !!data?.otherConditions
        };
        setHealthCheck(updatedCheck);
        runRiskAssessment(false, updatedCheck);
      } else if (type === 'ASSIGN_CHW') {
        if (data?.chwId && data?.chwName) {
          assignCHW(data.chwId, data.chwName);
        }
      }
    };

    window.addEventListener('carebridge-action', handleCareBridgeAction);
    return () => {
      window.removeEventListener('carebridge-action', handleCareBridgeAction);
    };
  }, [lastAssessmentId, assessmentResult]);

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
        
        if (idx === 1) { // Vaginal Hemorrhage (was 0)
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
        } else if (idx === 2) { // Pain (was 1)
          if (resultText.includes('severe') || resultText.includes('grave')) {
            setHealthCheck(p => ({ ...p, painLevel: 'severe' }));
          } else if (resultText.includes('moderate') || resultText.includes('moyen')) {
            setHealthCheck(p => ({ ...p, painLevel: 'moderate' }));
          } else if (resultText.includes('mild') || resultText.includes('faible')) {
            setHealthCheck(p => ({ ...p, painLevel: 'mild' }));
          }
        } else if (idx === 3) { // Dizziness (was 2)
          if (resultText.includes('yes') || resultText.includes('oui')) {
            setHealthCheck(p => ({ ...p, fainting: true, dizzy: true }));
          }
        } else if (idx === 5) { // Fever (was 4)
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
      "Section 1: Gestational age. Please specify your gestational age in pregnancy weeks.",
      "Section 2: Bleeding history. Please select bleeding severity, whether you are soaking pads, and if you are passing blood clots.",
      "Section 3: Pain history. Select your pain level, and if you have cramping or one-sided localized pain.",
      "Section 4: Dizziness and fainting. Note if you have fainted, feel dizzy, or have severe body weakness.",
      "Section 5: Pregnancy history. Flag if you have a history of miscarriages or ectopic pregnancies.",
      "Section 6: Fever and infection. Flag if you have fever, chills, or abnormal discharge.",
      "Section 7: Procedure or medication. Have you had a surgical termination or taken medical abortion pills recently?",
      "Section 8: Existing medical conditions. Select any chronic conditions like high blood pressure, diabetes, or anemia."
    ];
    speakText(guides[idx]);
  };

  // Run AI Risk Logic
  const runRiskAssessment = async (silent = false, tempHealthCheck?: any) => {
    const activeCheck = tempHealthCheck || healthCheck;
    setAssessing(true);
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let reasonText = '';
    let apiSuccess = false;

    // 1. Prepare Local Risk Logic to determine backup
    let localRisk: 'low' | 'moderate' | 'high' = 'low';
    let localReasonText = '';
    if (
      activeCheck.bleedingSeverity === 'heavy' ||
      activeCheck.soakingPads ||
      activeCheck.fainting ||
      activeCheck.painLevel === 'severe' ||
      activeCheck.fever
    ) {
      localRisk = 'high';
      const concerns = [];
      if (activeCheck.bleedingSeverity === 'heavy' || activeCheck.soakingPads) concerns.push("hemorrhaging indicators (heavy bleeding or soaking pads)");
      if (activeCheck.fainting) concerns.push("fainting episodes");
      if (activeCheck.painLevel === 'severe') concerns.push("severe abdominal pain");
      if (activeCheck.fever) concerns.push("fever (potential systemic infection)");
      
      localReasonText = `Critical recovery indicators detected: ${concerns.join(', ')}. There is an elevated risk of severe post-pregnancy loss complications (e.g. retained products of conception, infection, or internal bleeding). Immediate medical attention is recommended.`;
    } else if (
      activeCheck.bleedingSeverity === 'moderate' ||
      activeCheck.painLevel === 'moderate' ||
      activeCheck.dizzy ||
      activeCheck.weakness ||
      activeCheck.chills ||
      activeCheck.foulDischarge ||
      activeCheck.prevEctopic
    ) {
      localRisk = 'moderate';
      const concerns = [];
      if (activeCheck.bleedingSeverity === 'moderate') concerns.push("moderate bleeding");
      if (activeCheck.painLevel === 'moderate') concerns.push("moderate pain/cramping");
      if (activeCheck.dizzy || activeCheck.weakness) concerns.push("dizziness or physical weakness");
      if (activeCheck.foulDischarge) concerns.push("abnormal discharge");
      if (activeCheck.prevEctopic) concerns.push("previous ectopic pregnancy");

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
        pds302: Number(activeCheck.pregnancyWeek) || 8.0,
        pds303: (activeCheck.abortionProcedure || activeCheck.prevMiscarriage) ? "Yes" : "No",
        pds310: activeCheck.fever ? "Yes" : "No",
        pds324: Number(activeCheck.pregnancyWeek) <= 12 ? "<=12 weeks" : ">12 weeks",
        pds401: "Incomplete Abortion",
        pds402: (activeCheck.fainting || activeCheck.foulDischarge || activeCheck.soakingPads || activeCheck.painLevel === 'severe') ? "Yes" : "No",
        pds501: "Yes",
        pds502: "MVA",
        pds503: "Clinical Officer",
        pds505: "Yes",
        pds507: "Yes",
        pds509: "No",
        pds510: "No",
        pds701: "Yes",
        pds702: "Yes",
        pds801: (activeCheck.fainting || activeCheck.soakingPads || activeCheck.painLevel === 'severe') ? "Referred / Admitted" : "Discharged well",
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

    // Save to Firestore assessments collection
    try {
      setAssignedCHW(null);
      const docRef = await addDoc(collection(db, 'assessments'), {
        patientName: session?.username || "Tomi",
        location: "Lagos Mainland",
        timestamp: new Date().toISOString(),
        riskLevel: riskLevel === 'high' ? 'High' : (riskLevel === 'moderate' ? 'Medium' : 'Low'),
        prediction: apiData.prediction,
        probability: apiData.probability,
        action: apiData.action,
        careGaps: apiData.careGaps,
        equityFlags: apiData.equityFlags,
        mentalHealthFlag: apiData.mentalHealthFlag,
        mentalHealthNote: apiData.mentalHealthNote,
        followUpRecommendation: apiData.followUpRecommendation,
        status: 'Pending',
        assignedCHWId: null
      });
      setLastAssessmentId(docRef.id);
    } catch (err) {
      console.warn("Failed to save assessment to Firestore:", err);
    }

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
        { title: "Specific Nutrition", text: "Eat leafy green vegetables rich in iron (promotes blood circulation), folate (assists recovery), and fiber (supports digestion)." },
        { title: "Drink warm broth", text: "Support hydration and electrolytes without chilling your stomach core." }
      ];
    } else if (risk === 'moderate') {
      return [
        { title: "Hydrate & Restore", text: "Aim for 8 to 10 glasses of water. Supporting blood volume recovery is critical." },
        { title: "Specific Nutrition", text: "Incorporate leafy green vegetables (rich in iron for blood circulation, folate for tissue recovery, and fiber for good digestion)." },
        { title: "Avoid sexual activity", text: "Do not insert anything in the vagina to prevent pelvic infection risks." }
      ];
    } else {
      return [
        { title: "Streak maintenance", text: "Continue tracking water. 8 glasses a day supports tissue healing." },
        { title: "Specific Nutrition", text: "Eat green vegetables (iron for circulation, folate for cell recovery, fiber for digestion) and protein instead of calorie tracking." },
        { title: "Gentle breathing", text: "Practice diaphragmatic breaths for 5 minutes morning and night." }
      ];
    }
  };

  const sections = [
    {
      title: "Gestational Age Status",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pregnancy Duration (Weeks)</span>
            <div className="flex items-center gap-4 bg-slate-100/50 p-2.5 rounded-2xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => setHealthCheck(prev => ({ ...prev, pregnancyWeek: Math.max(1, prev.pregnancyWeek - 1) }))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-xl font-black text-[#0F4C81]">{healthCheck.pregnancyWeek}</span>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">Weeks Gestation</span>
              </div>
              <button
                type="button"
                onClick={() => setHealthCheck(prev => ({ ...prev, pregnancyWeek: Math.min(42, prev.pregnancyWeek + 1) }))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-normal mt-1">
              * Note: First-trimester pregnancy loss is typically defined as occurring before 12 completed weeks, and second-trimester loss between 12 and 24 weeks. This parameter directly affects EPL Care clinical risk predictions.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Vaginal Hemorrhage Severity",
      icon: Droplets,
      content: (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Active Bleeding Severity</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { k: 'none', l: 'None' },
                { k: 'spotting', l: 'Spotting' },
                { k: 'moderate', l: 'Moderate Active' },
                { k: 'heavy', l: 'Heavy Saturation' }
              ].map(opt => (
                <button
                  key={opt.k}
                  onClick={() => setHealthCheck(prev => ({ ...prev, bleedingSeverity: opt.k }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.bleedingSeverity === opt.k ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Are you soaking pads (≥ 1 pad/hr)?</span>
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
            <span className="text-xs font-bold text-slate-700">Passing blood clots (large size)?</span>
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
      title: "Acute Abdominal & Pelvic Pain",
      icon: Activity,
      content: (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pain Intensity</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { k: 'none', l: 'None' },
                { k: 'mild', l: 'Mild Pain' },
                { k: 'moderate', l: 'Moderate Pain' },
                { k: 'severe', l: 'Acute Severe' }
              ].map(opt => (
                <button
                  key={opt.k}
                  onClick={() => setHealthCheck(prev => ({ ...prev, painLevel: opt.k }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.painLevel === opt.k ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-2">
            <span className="text-xs font-bold text-slate-700">Experiencing uterine cramping?</span>
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
            <span className="text-xs font-bold text-slate-700">One-sided localized adnexal pain?</span>
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
      title: "Syncope & Orthostatic Dizziness",
      icon: HeartPulse,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">Syncope / Loss of consciousness?</span>
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
            <span className="text-xs font-bold text-slate-700">Orthostatic dizziness or lightheadedness?</span>
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
            <span className="text-xs font-bold text-slate-700">Asthenia / Severe body weakness?</span>
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
      title: "Obstetric Risk Factors",
      icon: ClipboardList,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Previous spontaneous miscarriage history?</span>
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
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Previous ectopic pregnancy history?</span>
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
      title: "Pyrexia & Infection Symptoms",
      icon: Thermometer,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">Pyrexia / Febrile illness (Fever ≥ 38.0°C)?</span>
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
            <span className="text-xs font-bold text-slate-700">Rigor / Chills / Shivering?</span>
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
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Purulent / Foul-smelling vaginal discharge?</span>
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
      title: "Post-abortion Intervention History",
      icon: Pill,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Prior surgical uterine evacuation (MVA/D&C)?</span>
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
            <span className="text-xs font-bold text-slate-700 flex-1 pr-2">Recent medical abortion pharmacotherapy?</span>
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
      title: "Co-morbidities & Chronic Risk Factors",
      icon: ShieldAlert,
      content: (
        <div className="space-y-3">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select all conditions that apply</span>
          <div className="flex flex-wrap gap-2">
            {[
              { k: 'hypertension', l: 'Gestational / Chronic Hypertension' },
              { k: 'diabetes', l: 'Gestational Diabetes Mellitus' },
              { k: 'anemia', l: 'Anemia (Hb < 11g/dL)' },
              { k: 'otherConditions', l: 'Other Clinical Co-morbidities' },
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

      {/* Dynamic Triage & Health Check Assessment Results (Full Width at Top) */}
      <AnimatePresence>
        {assessmentResult && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="mb-8 w-full"
          >
            <Card className={`p-6 sm:p-8 rounded-[2.5rem] border shadow-md relative overflow-hidden ${
              assessmentResult.risk === 'high' 
                ? 'bg-rose-50/70 border-rose-200 text-rose-955' 
                : (assessmentResult.risk === 'moderate' 
                    ? 'bg-amber-50/70 border-amber-200 text-amber-955' 
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950')
            }`}>
              
              <div className="relative z-10 flex flex-col gap-6">
                
                {/* Header of results */}
                <div className="flex justify-between items-center border-b pb-4 border-slate-200/50">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      assessmentResult.risk === 'high' ? 'bg-rose-500/20 text-rose-600' :
                      assessmentResult.risk === 'moderate' ? 'bg-amber-500/20 text-amber-600' :
                      'bg-emerald-500/20 text-emerald-600'
                    }`}>
                      <HeartPulse className={assessmentResult.risk === 'high' ? 'animate-pulse' : ''} size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">CareBridge AI Clinical Insight</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Triage Diagnosis & Action Routing</p>
                    </div>
                  </div>
                  
                  <Badge className={`uppercase text-[9px] font-black tracking-widest px-3.5 py-1 rounded-full border-none shadow-xs ${
                    assessmentResult.risk === 'high' 
                      ? 'bg-rose-600 text-white' 
                      : (assessmentResult.risk === 'moderate' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-emerald-600 text-white')
                  }`}>
                    {assessmentResult.risk} RISK
                  </Badge>
                </div>

                {/* Grid for desktop layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-slate-800">
                  
                  {/* Left Column: Insight & Progress (lg:col-span-5) */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">AI Diagnosis Summary</span>
                      <p className="text-[11.5px] leading-relaxed font-bold text-slate-700">
                        {assessmentResult.text}
                      </p>
                    </div>

                    {/* Follow-up Likelihood Indicator */}
                    {assessmentResult.prediction !== undefined && assessmentResult.probability !== undefined && (
                      <div className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/40 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Follow-up Recommendation</span>
                          <span className={assessmentResult.prediction === 1 ? "text-emerald-600" : "text-amber-600"}>
                            {assessmentResult.prediction === 1 ? 'Required' : 'Optional'} ({Math.round(assessmentResult.probability * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${assessmentResult.prediction === 1 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${assessmentResult.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* WhatsApp follow-up checkbox */}
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="whatsappOptIn"
                        checked={whatsappOptIn}
                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer border-slate-300"
                      />
                      <label htmlFor="whatsappOptIn" className="text-[10px] font-bold text-slate-500 cursor-pointer leading-tight">
                        Opt into follow-ups & wellness check-ins on WhatsApp
                      </label>
                    </div>

                    <Button
                      onClick={() => {
                        setAssessmentResult(null);
                        setAssignedCHW(null);
                      }}
                      variant="outline"
                      className="w-full h-10 border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-white/80 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Clear Report & Start New Test
                    </Button>
                  </div>

                  {/* Right Column: Actions & Services (lg:col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    
                    {/* Clinical Action Notice */}
                    {assessmentResult.action && (
                      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1 shadow-md">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Immediate Action Required</span>
                        <p className="text-[11px] font-semibold leading-relaxed text-slate-200">{assessmentResult.action}</p>
                      </div>
                    )}

                    {/* Care Gaps */}
                    {assessmentResult.careGaps && assessmentResult.careGaps.length > 0 && (
                      <div className="p-4 bg-amber-100/40 border border-amber-200/30 rounded-2xl space-y-2">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">⚠️ Identified Care Gaps ({assessmentResult.careGaps.length})</span>
                        <ul className="space-y-1">
                          {assessmentResult.careGaps.map((gap: string, i: number) => (
                            <li key={i} className="text-[10px] font-extrabold text-amber-900 leading-normal flex items-start gap-2">
                              <span className="shrink-0 text-amber-500">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Equity Barriers */}
                    {assessmentResult.equityFlags && assessmentResult.equityFlags.length > 0 && (
                      <div className="p-4 bg-blue-100/40 border border-blue-200/30 rounded-2xl space-y-2">
                        <span className="text-[9px] font-black text-[#0F4C81] uppercase tracking-widest block">📍 Equity Barriers Detected</span>
                        <ul className="space-y-1">
                          {assessmentResult.equityFlags.map((flag: string, i: number) => (
                            <li key={i} className="text-[10px] font-extrabold text-slate-600 leading-normal flex items-start gap-2">
                              <span className="shrink-0 text-primary">•</span>
                              <span>{flag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mental Health Flag */}
                    {assessmentResult.mentalHealthFlag && (
                      <div className="p-4 bg-purple-100/40 border border-purple-200/30 rounded-2xl space-y-1.5">
                        <span className="text-[9px] font-black text-purple-800 uppercase tracking-widest block">🧠 Mental Health Flagged</span>
                        <p className="text-[10px] font-extrabold text-purple-900 leading-normal">{assessmentResult.mentalHealthNote}</p>
                        <button 
                          onClick={() => alert("Connecting to CareBridge counseling support services...")}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer border-none"
                        >
                          Connect to Counselor
                        </button>
                      </div>
                    )}

                    {/* CHW Connect Panel */}
                    {(assessmentResult.risk === 'high' || assessmentResult.risk === 'moderate') && (
                      <div className="p-4 bg-white/70 border border-slate-100/80 rounded-2xl flex flex-col gap-3 text-slate-800 shadow-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Available Support Workers</h4>
                            <p className="text-[8px] text-slate-400 font-bold">Connect with a professional counselor</p>
                          </div>
                          <Badge className="bg-[#0F4C81] text-white text-[8px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 border-none">
                            {assignedCHW ? "Assigned" : "PAC Ready"}
                          </Badge>
                        </div>

                        {assignedCHW ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-800">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                            <div>
                              <span className="font-extrabold text-[11px] block">Specialist Assigned</span>
                              <p className="text-[10px] opacity-90 leading-tight">{assignedCHW} has been notified and will contact you for clinical support.</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[
                                { id: 'chw_tomi', name: 'Nurse Tomi', location: 'Lagos PAC Dept', avatar: 'https://images.unsplash.com/photo-1590642916589-592bca10dfbf?auto=format&fit=crop&q=80&w=100&h=100' },
                                { id: 'chw_amina', name: 'Sister Amina', location: 'Ikeja Center', avatar: 'https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=100&h=100' },
                                { id: 'chw_kelechi', name: 'Dr. Kelechi', location: 'Surulere Center', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100&h=100' }
                              ].map((chw) => (
                                <div 
                                  key={chw.id}
                                  onClick={() => assignCHW(chw.id, chw.name)}
                                  className="p-2 border border-slate-100 rounded-xl hover:border-blue-200 transition-all flex flex-col gap-1 items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-white"
                                >
                                  <img src={chw.avatar} alt={chw.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                  <div>
                                    <span className="font-extrabold text-[10px] text-slate-800 block leading-none">{chw.name}</span>
                                    <span className="text-[7.5px] text-slate-400 font-bold uppercase mt-0.5 block leading-none">{chw.location}</span>
                                  </div>
                                  <span className="text-[8.5px] font-black text-primary px-2 py-0.5 rounded bg-blue-50/50 w-full">Select</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                onClick={() => {
                                  const chws = [
                                    { id: 'chw_tomi', name: 'Nurse Tomi' },
                                    { id: 'chw_amina', name: 'Sister Amina' },
                                    { id: 'chw_kelechi', name: 'Dr. Kelechi' }
                                  ];
                                  const randomCHW = chws[Math.floor(Math.random() * chws.length)];
                                  assignCHW(randomCHW.id, randomCHW.name);
                                }}
                                className="w-full h-8.5 bg-[#0F4C81] text-white hover:opacity-95 rounded-xl font-black uppercase tracking-wider text-[9px] border-none transition-opacity cursor-pointer"
                              >
                                AI Auto-Match CHW
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Emergency Escalation Panel for High Risk */}
                    {assessmentResult.risk === 'high' && (
                      <div className="p-4 border-none bg-rose-600 text-white rounded-2xl shadow-md relative overflow-hidden group">
                        <div className="relative z-10 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
                              <AlertTriangle size={18} />
                            </div>
                            <h4 className="font-black text-sm tracking-tight">Emergency Care Route Active</h4>
                          </div>
                          
                          <p className="text-[11px] text-rose-100 leading-relaxed font-medium">
                            Critical danger indicators are present. CareBridge AI has simulated an urgent clinical notification dispatch to Lagos Maternal Center. Please call our clinical coordinator immediately.
                          </p>

                          <div className="flex gap-2">
                            <Button 
                              onClick={() => { setShowEmergencyCall(true); alert("Connecting with Lagos Maternal Center Emergency Desk..."); }}
                              className="flex-1 h-9 bg-white hover:bg-rose-50 text-rose-600 font-extrabold rounded-xl uppercase tracking-wider text-[9px] gap-1.5 shadow-md shadow-rose-900/20 border-none transition-all cursor-pointer"
                            >
                              <Phone size={12} /> Call Coordinator
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => alert("Clinic notified: Patient has marked intent to arrive within 15 minutes.")}
                              className="h-9 border border-white/30 hover:bg-white/10 text-white font-extrabold rounded-xl uppercase tracking-wider text-[9px] transition-all cursor-pointer"
                            >
                              Map Route
                            </Button>
                          </div>

                          {/* Hospital Suggestions */}
                          <div className="border-t border-rose-500/40 pt-3 space-y-2">
                            <span className="text-[9px] font-black uppercase text-rose-100 tracking-wider block">
                              Suggested Facilities (Urgency Level 2-3)
                            </span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                {
                                  name: "City Maternal Care",
                                  distance: "2.4 km",
                                  urgency: "Level 3",
                                  address: "12 Medical Road, Ikeja",
                                  specialty: "EPAU, OBGYN"
                                },
                                {
                                  name: "St. Jude Women’s Hosp.",
                                  distance: "5.1 km",
                                  urgency: "Level 2",
                                  address: "45 Unity Street, Surulere",
                                  specialty: "OBGYN, Post-loss Care"
                                }
                              ].map(hosp => (
                                <div key={hosp.name} className="p-2.5 bg-white/10 rounded-xl border border-white/5 flex flex-col gap-1 text-white">
                                  <div className="flex justify-between items-center">
                                    <h5 className="font-extrabold text-[10.5px] truncate">{hosp.name}</h5>
                                    <span className="text-[7.5px] font-black px-1 py-0.25 bg-rose-700 border border-rose-600 rounded uppercase">
                                      {hosp.urgency}
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] text-rose-100 font-bold uppercase tracking-wider">{hosp.distance} • {hosp.specialty}</p>
                                  <div className="flex gap-1.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => alert(`Calling ${hosp.name}...`)}
                                      className="flex-1 py-1 text-[8px] font-black bg-white text-rose-600 rounded-lg hover:bg-rose-50 transition-colors uppercase tracking-wider cursor-pointer border-none"
                                    >
                                      Call
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => alert(`Mapping route to ${hosp.name} (${hosp.address})...`)}
                                      className="flex-1 py-1 text-[8px] font-black bg-white/25 hover:bg-white/35 text-white rounded-lg transition-colors border border-white/15 uppercase tracking-wider cursor-pointer border-none"
                                    >
                                      Route
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Daily Care & Symptoms */}
        <div className="lg:col-span-7 space-y-6">
          {/* Responsive Streak & Daily Vitals check-in Panel */}
          <Card className="p-5 border border-slate-100 rounded-[2rem] bg-white shadow-sm space-y-4">
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

          {/* Recovery Health Check Upgraded Section */}
          <div className="space-y-6">
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
          </div>
        </div>

        {/* Right Column: Reflections, AI Results, Emergency & Support */}
        <div className="lg:col-span-5 space-y-6">
          {!supportMessage ? (
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-8"
            >
              <Card className="p-5 sm:p-10 border-none bg-slate-900 text-white rounded-[2.25rem] sm:rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(15,76,129,0.3)] relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black tracking-tight">Daily Symptom Log</h3>
                      <button 
                        onClick={simulateVoiceSpeak}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-secondary text-white' : 'bg-white/10 text-white/40'}`}
                      >
                        <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed italic">"Log your physical symptoms and mood daily. Type freely; our clinical keyword scanner will automatically highlight tags."</p>
                    
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

                    <div className="bg-white/5 rounded-[2rem] p-6 mb-6 border border-white/10 focus-within:border-secondary/40 transition-colors">
                      <p className="text-[10px] uppercase font-black tracking-[0.2em] text-secondary mb-4">Daily Symptoms & Reflections</p>
                      <textarea
                        placeholder="Describe physical symptoms (e.g. bleeding, pelvic pain, headache, fever) or how you feel today..."
                        value={note}
                        onChange={(e) => {
                          setNote(e.target.value);
                          handleNoteChange(e.target.value);
                        }}
                        className="w-full bg-transparent text-sm focus:outline-none placeholder:text-white/20 min-h-[120px] font-medium resize-none"
                      />
                    </div>

                    {/* Clickable and Suggested Symptom Tags */}
                    <div className="mb-8 space-y-2.5">
                      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 block">Symptom Tags (Click to toggle)</span>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                isSelected 
                                  ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/20' 
                                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button 
                      onClick={handleLog}
                      disabled={mood === null || loading}
                      className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 font-black transition-all shadow-xl shadow-black/20 text-base uppercase tracking-wider"
                    >
                      {loading ? 'Processing...' : 'Log Daily Symptoms'}
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
          {/* Community Support */}
          <div className="space-y-4">
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
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Step {modalStep + 1} of {sections.length}</span>
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
                      style={{ width: `${((modalStep + 1) / sections.length) * 100}%` }}
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
                    {modalStep < sections.length - 1 ? (
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
