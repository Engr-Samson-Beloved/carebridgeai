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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [securityPin, setSecurityPin] = useState(() => localStorage.getItem('carebridge_privacy_pin') || '1234');
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Daily Streak & Vitals States
  const [streak, setStreak] = useState(5);
  const [waterGlasses, setWaterGlasses] = useState(2);
  const [mealEaten, setMealEaten] = useState(false);
  const [medTaken, setMedTaken] = useState(false);

  const [healthCheck, setHealthCheck] = useState({
    pregnancyWeek: 8,
    location: 'Lagos Mainland',
    nausea: false,
    vomiting: 'none', // 'none' | 'medication-down' | 'food-down' | 'mild'
    headache: 'none', // 'none' | 'mild' | 'moderate' | 'severe'
    dizziness: 'none', // 'none' | 'mild' | 'moderate' | 'severe'
    spotting: false,
    abdominalPain: 'none', // 'none' | 'mild' | 'moderate' | 'severe'
    heavyBleeding: false,
    passingClots: false,
    pelvicPainOneSided: false,
    fever: false,
    prevMiscarriage: false,
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

    // Save to Firestore symptom_logs collection (Non-blocking)
    try {
      addDoc(collection(db, 'symptom_logs'), {
        patientName: session?.username || "Tomi",
        timestamp: new Date().toISOString(),
        mood: mood,
        note: note,
        tags: selectedTags
      }).catch(err => console.warn("Firestore save error:", err));
    } catch (err) {
      console.warn("Failed to save daily symptom log to Firestore:", err);
    }

    try {
      const msg = await generateSupportMessage(mood, note);
      setSupportMessage(msg);
    } catch (err) {
      console.warn("generateSupportMessage failed:", err);
    }
    setLoading(false);
  };

  const handleLogSymptomsDirectly = async (logMood: number, logNote: string, logTags: string[]) => {
    setMood(logMood);
    setNote(logNote);
    setSelectedTags(logTags);
    setLoading(true);

    // Save to Firestore (Non-blocking)
    try {
      addDoc(collection(db, 'symptom_logs'), {
        patientName: session?.username || "Tomi",
        timestamp: new Date().toISOString(),
        mood: logMood,
        note: logNote,
        tags: logTags
      }).catch(err => console.warn("Firestore save error:", err));
    } catch (err) {
      console.warn("Failed to save daily symptom log to Firestore:", err);
    }

    try {
      const msg = await generateSupportMessage(logMood, logNote);
      setSupportMessage(msg);
    } catch (err) {
      console.warn("generateSupportMessage failed:", err);
    }
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
          location: data?.location || 'Lagos Mainland',
          nausea: !!data?.nausea,
          vomiting: data?.vomiting || (data?.vomit ? 'mild' : 'none'),
          headache: data?.headache || 'none',
          dizziness: data?.dizziness || (data?.dizzy ? 'mild' : 'none'),
          spotting: !!data?.spotting || data?.bleedingSeverity === 'spotting',
          abdominalPain: data?.abdominalPain || data?.painLevel || 'none',
          heavyBleeding: !!data?.heavyBleeding || !!data?.soakingPads || data?.bleedingSeverity === 'heavy',
          passingClots: !!data?.passingClots || !!data?.bloodClots,
          pelvicPainOneSided: !!data?.pelvicPainOneSided || !!data?.oneSidedPain,
          fever: !!data?.fever,
          prevMiscarriage: !!data?.prevMiscarriage
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

  React.useEffect(() => {
    const historyRaw = localStorage.getItem('carebridge_assessments_history');
    if (!historyRaw) {
      const mockHistory = [
        {
          id: "Local-mock-1",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          riskLevel: "High",
          text: "High risk triage classification. Seek immediate medical care.",
          action: "Do not discharge this patient without a confirmed follow-up appointment. Intervene immediately. Assign a community health worker for post-discharge support.",
          careGaps: [
            "Patient was not referred for further care — referral is the strongest predictor of follow-up completion",
            "Patient arrived without a referral note — breakdown in referral pathway",
            "Patient spent less than 12 hours in the facility — rushed discharge increases risk"
          ],
          equityFlags: [
            "Rural location — patient faces geographic and transport barriers to follow-up care",
            "Below average socioeconomic status — cost of follow-up care may be a barrier"
          ],
          mentalHealthFlag: true,
          mentalHealthNote: "Patient has mental health risk factors. Psychological support and grief counselling recommended.",
          followUpRecommendation: "Arrange immediate home nurse check-in.",
          symptoms: {
            pregnancyWeek: 10,
            location: "Lagos Mainland",
            nausea: true,
            vomiting: "food-down",
            headache: "severe",
            dizziness: "severe",
            spotting: true,
            heavyBleeding: true,
            passingClots: true,
            abdominalPain: "severe",
            pelvicPainOneSided: true,
            fever: true,
            prevMiscarriage: true
          }
        },
        {
          id: "Local-mock-2",
          timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
          riskLevel: "Medium",
          text: "Medium risk triage classification. Visit clinic within 24-48 hrs, consider ultrasound assessment, and follow up with a healthcare provider.",
          action: "Confirm follow-up appointment is scheduled before discharge. Call or text patient within 48 hours to confirm attendance. Flag for community health worker check-in.",
          careGaps: [
            "Male partner was not included in post-loss counselling — reduces likelihood of follow-up attendance",
            "Patient spent less than 12 hours in the facility — rushed discharge increases risk"
          ],
          equityFlags: [
            "Below average socioeconomic status — cost of follow-up care may be a barrier"
          ],
          mentalHealthFlag: false,
          mentalHealthNote: "No immediate mental health risk factors identified. Standard post-loss support applies.",
          followUpRecommendation: "Schedule follow-up appointment within 1 week.",
          symptoms: {
            pregnancyWeek: 8,
            location: "Ikeja",
            nausea: true,
            vomiting: "frequent",
            headache: "moderate",
            dizziness: "moderate",
            spotting: true,
            heavyBleeding: false,
            passingClots: false,
            abdominalPain: "moderate",
            pelvicPainOneSided: false,
            fever: false,
            prevMiscarriage: false
          }
        },
        {
          id: "Local-mock-3",
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          riskLevel: "Low",
          text: "Low risk triage classification. Continue monitoring, stay hydrated, attend routine ANC care, and repeat assessment if symptoms worsen.",
          action: "Proceed with standard discharge. Ensure follow-up appointment is scheduled and documented in patient records.",
          careGaps: [],
          equityFlags: [],
          mentalHealthFlag: false,
          mentalHealthNote: "No immediate mental health risk factors identified. Standard post-loss support applies.",
          followUpRecommendation: "Schedule standard follow-up appointment within 2 weeks.",
          symptoms: {
            pregnancyWeek: 6,
            location: "Surulere",
            nausea: false,
            vomiting: "none",
            headache: "none",
            dizziness: "none",
            spotting: false,
            heavyBleeding: false,
            passingClots: false,
            abdominalPain: "none",
            pelvicPainOneSided: false,
            fever: false,
            prevMiscarriage: false
          }
        }
      ];
      localStorage.setItem('carebridge_assessments_history', JSON.stringify(mockHistory));
    }
  }, []);

  const [transitStep, setTransitStep] = useState(0);
  const [isTransitExpanded, setIsTransitExpanded] = useState(true);

  React.useEffect(() => {
    if (assessmentResult && (assessmentResult.risk === 'high' || assessmentResult.risk === 'moderate')) {
      setTransitStep(0);
      const t1 = setTimeout(() => setTransitStep(1), 3000);
      const t2 = setTimeout(() => setTransitStep(2), 7000);
      const t3 = setTimeout(() => setTransitStep(3), 11000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [assessmentResult]);

  const simulatePostToWhatsapp = () => {
    alert("Simulation: Your recovery summary has been synced to your private WhatsApp line.");
  };

  const simulateVoiceSpeak = () => {
    speakText("Take a deep breath. Your body and heart deserve space to heal today.");
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-US' : (language === 'fr' ? 'fr-FR' : (language === 'sw' ? 'sw-KE' : (language === 'yo' ? 'yo-NG' : 'ha-NG')));
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
      recognition.lang = language === 'en' ? 'en-US' : (language === 'fr' ? 'fr-FR' : (language === 'sw' ? 'sw-KE' : (language === 'yo' ? 'yo-NG' : 'ha-NG')));
      
      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript.toLowerCase();
        const checkAny = (words: string[]) => words.some(w => resultText.includes(w));
        
        if (idx === 1) { // Gastrointestinal
          if (checkAny(['nausea', 'sick', 'queasy', 'nauseous', 'nausée', 'nausee', 'mal au cœur', 'mal au coeur', 'kichefuchefu', 'chefuka', 'inu riru', 'riru inu', 'tashin zuciya'])) {
            setHealthCheck(p => ({ ...p, nausea: true }));
          }
          if (checkAny(['vomit', 'throw up', 'throwing up', 'puke', 'vomir', 'vomissement', 'kutapika', 'tapika', 'ebi', 'èébì', 'amai', 'amaye'])) {
            if (checkAny(['medication', 'meds', 'medicine', 'oògùn', 'oogun', 'magani', 'médicament', 'medicament', 'dawa'])) {
              setHealthCheck(p => ({ ...p, vomiting: 'medication-down' }));
            } else if (checkAny(['food', 'eat', 'nourriture', 'manger', 'chakula', 'oúnjẹ', 'ounje', 'abinci'])) {
              setHealthCheck(p => ({ ...p, vomiting: 'food-down' }));
            } else if (checkAny(['frequent', 'often', 'frequent', 'mara kwa mara', 'loorekoore', 'akai-akai'])) {
              setHealthCheck(p => ({ ...p, vomiting: 'frequent' }));
            } else if (checkAny(['mild', 'occasional', 'léger', 'leger', 'modéré', 'modere', 'kidogo', 'dile', 'diẹ', 'die', 'kadan'])) {
              setHealthCheck(p => ({ ...p, vomiting: 'mild' }));
            } else {
              setHealthCheck(p => ({ ...p, vomiting: 'mild' }));
            }
          }
        } else if (idx === 2) { // Neurological
          if (checkAny(['headache', 'head', 'migraine', 'mal de tête', 'mal de tete', 'tête', 'tete', 'kichwa', 'maumivu ya kichwa', 'fifo orí', 'fifo ori', 'ori fifo', 'ciwon kai', 'kai'])) {
            if (checkAny(['severe', 'grave', 'fort', 'mbaya', 'patashika', 'gidi', 'kíkankíkan', 'kikankikan', 'soma', 'tsanani', 'mai tsanani'])) {
              setHealthCheck(p => ({ ...p, headache: 'severe' }));
            } else if (checkAny(['moderate', 'moyen', 'kati', 'dọ́ba', 'dọba', 'tsaka-tsaki', 'tsaka tsaki', 'matsakaici'])) {
              setHealthCheck(p => ({ ...p, headache: 'moderate' }));
            } else if (checkAny(['mild', 'léger', 'leger', 'mali', 'dile', 'diẹ', 'die', 'kadan'])) {
              setHealthCheck(p => ({ ...p, headache: 'mild' }));
            } else {
              setHealthCheck(p => ({ ...p, headache: 'mild' }));
            }
          }
          if (checkAny(['dizzy', 'dizziness', 'lightheaded', 'spinning', 'vertige', 'étourdissement', 'etourdissement', 'tournis', 'kizunguzungu', 'zunguzungu', 'òyì', 'oyi', 'jiri', 'juwa'])) {
            if (checkAny(['severe', 'grave', 'fort', 'mbaya', 'patashika', 'gidi', 'kíkankíkan', 'kikankikan', 'soma', 'tsanani', 'mai tsanani'])) {
              setHealthCheck(p => ({ ...p, dizziness: 'severe' }));
            } else if (checkAny(['moderate', 'moyen', 'kati', 'dọ́ba', 'dọba', 'tsaka-tsaki', 'tsaka tsaki', 'matsakaici'])) {
              setHealthCheck(p => ({ ...p, dizziness: 'moderate' }));
            } else if (checkAny(['mild', 'improves', 'rest', 'léger', 'leger', 'repos', 'mali', 'dile', 'diẹ', 'die', 'kadan'])) {
              setHealthCheck(p => ({ ...p, dizziness: 'mild' }));
            } else {
              setHealthCheck(p => ({ ...p, dizziness: 'mild' }));
            }
          }
        } else if (idx === 3) { // Bleeding & Pain
          if (checkAny(['spotting', 'spot', 'light bleeding', 'taches', 'perte légère', 'perte legere', 'saignement léger', 'saignement leger', 'madoadoa', 'damu kidogo', 'alefọ̀', 'alefo', 'dige-dige', 'ɗugo-ɗugo', 'dugo-dugo'])) {
            setHealthCheck(p => ({ ...p, spotting: true }));
          }
          if (checkAny(['heavy', 'bleeding', 'blood', 'saignement abondant', 'saignement', 'abondant', 'hémorragie', 'hemorragie', 'beaucoup de sang', 'saigne fort', 'damu nyingi', 'eje pupo', 'eje pupọ', 'ẹ̀jẹ̀ púpọ̀', 'jini mai yawa', 'zub da jini'])) {
            setHealthCheck(p => ({ ...p, heavyBleeding: true }));
          }
          if (checkAny(['clot', 'tissue', 'lump', 'caillot', 'bonge', 'mabonge', 'didi eje', 'dídì ẹ̀jẹ̀', 'koko eje', 'gudan jini'])) {
            setHealthCheck(p => ({ ...p, passingClots: true }));
          }
          if (checkAny(['pain', 'cramp', 'stomach', 'abdomen', 'belly', 'douleur', 'crampe', 'ventre', 'estomac', 'tumbo', 'maumivu ya tumbo', 'roro inu', 'irora inu', 'inu ríro', 'ciwon ciki', 'ciki', 'murdawa'])) {
            if (checkAny(['severe', 'grave', 'fort', 'mbaya', 'patashika', 'gidi', 'kíkankíkan', 'kikankikan', 'soma', 'tsanani', 'mai tsanani'])) {
              setHealthCheck(p => ({ ...p, abdominalPain: 'severe' }));
            } else if (checkAny(['moderate', 'moyen', 'kati', 'dọ́ba', 'dọba', 'tsaka-tsaki', 'tsaka tsaki', 'matsakaici'])) {
              setHealthCheck(p => ({ ...p, abdominalPain: 'moderate' }));
            } else if (checkAny(['mild', 'léger', 'leger', 'mali', 'dile', 'diẹ', 'die', 'kadan'])) {
              setHealthCheck(p => ({ ...p, abdominalPain: 'mild' }));
            } else {
              setHealthCheck(p => ({ ...p, abdominalPain: 'mild' }));
            }
          }
          if (checkAny(['one sided', 'one-sided', 'side', 'pelvic', 'hip', 'côté', 'cote', 'un côté', 'un cote', 'upande', 'apá kan', 'apa kan', 'egbe kan', 'gefe guda', 'gefe daya'])) {
            setHealthCheck(p => ({ ...p, pelvicPainOneSided: true }));
          }
        } else if (idx === 4) { // History & Vitals
          if (checkAny(['fever', 'hot', 'temperature', 'fièvre', 'fievre', 'chaud', 'homa', 'moto', 'joto', 'ibà', 'iba', 'gbigbona ara', 'gbona', 'zazzabi', 'zafi'])) {
            setHealthCheck(p => ({ ...p, fever: true }));
          }
          if (checkAny(['miscarriage', 'lost pregnancy', 'lost baby', 'abortion', 'fausse couche', 'avortement', 'haribika', 'mimba kuharibika', 'kuharibika kwa mimba', 'isenu', 'ìṣẹ́nú', 'bari', 'zubar da ciki'])) {
            setHealthCheck(p => ({ ...p, prevMiscarriage: true }));
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
    const guides: Record<Language, string[]> = {
      en: [
        "Section 1: Gestational age. Please specify your gestational age in pregnancy weeks.",
        "Section 2: Gastrointestinal symptoms. Please indicate if you have nausea or vomiting, and specify the vomiting severity.",
        "Section 3: Neurological symptoms. Please specify if you have a headache or dizziness, and select the severity.",
        "Section 4: Bleeding and pain. Indicate if you have spotting, abdominal pain, heavy bleeding, passing clots, or one-sided pelvic pain.",
        "Section 5: History and vitals. Please state if you have a fever or a history of miscarriage."
      ],
      fr: [
        "Section 1 : Âge gestationnel. Veuillez préciser votre âge gestationnel en semaines de grossesse.",
        "Section 2 : Symptômes gastro-intestinaux. Veuillez indiquer si vous avez des nausées ou des vomissements, et préciser la gravité des vomissements.",
        "Section 3 : Symptômes neurologiques. Veuillez préciser si vous avez des maux de tête ou des vertiges, et sélectionner l'intensité.",
        "Section 4 : Saignements et douleurs. Indiquez si vous avez des saignements légers, des douleurs abdominales, des saignements abondants, des caillots ou une douleur pelvienne unilatérale.",
        "Section 5 : Antécédents et signes vitaux. Veuillez indiquer si vous avez de la fièvre ou des antécédents de fausse couche."
      ],
      sw: [
        "Sehemu ya 1: Umri wa ujauzito. Tafadhali bainisha umri wako wa ujauzito katika wiki.",
        "Sehemu ya 2: Dalili za tumbo na mmeng'enyo. Tafadhali onyesha ikiwa una kichefuchefu au kutapika, na ubainishe kiwango cha kutapika.",
        "Sehemu ya 3: Dalili za mfumo wa neva. Tafadhali bainisha ikiwa una maumivu ya kichwa au kizunguzungu, na uchague kiwango.",
        "Sehemu ya 4: Kutoka damu na maumivu. Onyesha ikiwa una madoadoa ya damu, maumivu ya tumbo, kutoka damu nyingi, mabonge ya damu, au maumivu ya nyonga ya upande mmoja.",
        "Sehemu ya 5: Historia na viashiria vya afya. Tafadhali taja ikiwa una homa au historia ya kuharibika kwa mimba."
      ],
      yo: [
        "Abala 1: Ọjọ-ori oyun. Jọwọ sọ pato ọjọ-ori oyun rẹ ni awọn ọsẹ oyun.",
        "Abala 2: Àwọn àmì gastrointestinal. Jọwọ tọka si ti o ba ni ríru tabi eebi, ki o si sọ pato bi eebi rẹ ti ri.",
        "Abala 3: Àwọn àmì neurological. Jọwọ sọ pato ti o ba ni fífọ́ orí tabi oyi oju, ki o si yan bi o ti ri.",
        "Abala 4: Ẹ̀jẹ̀ ati irora. Tọka si ti o ba ni àléfọ̀, irora inu, ẹ̀jẹ̀ pupọ, ẹ̀jẹ̀ ti o dì, tabi irora ìgbálẹ̀-abẹ́ apá kan.",
        "Abala 5: Ìtàn & awọn ami. Jọwọ sọ ti o ba ni ibà tabi ìtàn ìṣẹ́nú tẹ́lẹ̀."
      ],
      ha: [
        "Sashi na 1: Makonnin juna biyu. Da fatan za a bayyana makon cikin ku.",
        "Sashi na 2: Alamun ciki. Da fatan za a nuna idan kuna jin tashin zuciya ko amai, sannan ku bayyana tsananin aman.",
        "Sashi na 3: Alamun kwakwalwa da jiki. Da fatan za a bayyana idan kuna da ciwon kai ko juwa, sannan ku zaɓi tsananin.",
        "Sashi na 4: Zubar jini da ciwo. Nuna idan kuna da zubar jini kaɗan, ciwon ciki, zubar jini mai yawa, fitar da gudan jini, ko ciwon ƙugu na gefe ɗaya.",
        "Sashi na 5: Tarihi da alamomin jiki. Da fatan za a faɗi idan kuna da zazzabi ko tarihin zubar da ciki a baya."
      ]
    };
    const activeGuide = guides[language] || guides['en'];
    if (activeGuide[idx]) speakText(activeGuide[idx]);
  };

  // Run AI Risk Logic
  const runRiskAssessment = async (silent = false, tempHealthCheck?: any) => {
    const activeCheck = tempHealthCheck || healthCheck;
    setAssessing(true);
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';
    let reasonText = '';
    let apiSuccess = false;

    // 1. Prepare Local Risk Logic
    const isHigh = 
      activeCheck.vomiting === 'medication-down' ||
      activeCheck.vomiting === 'food-down' ||
      activeCheck.headache === 'severe' ||
      activeCheck.dizziness === 'severe' ||
      activeCheck.abdominalPain === 'severe' ||
      activeCheck.heavyBleeding ||
      activeCheck.passingClots ||
      activeCheck.pelvicPainOneSided ||
      activeCheck.fever;

    // Check if there are any active current symptoms
    const hasAnyCurrentSymptoms =
      activeCheck.nausea ||
      activeCheck.vomiting !== 'none' ||
      activeCheck.headache !== 'none' ||
      activeCheck.dizziness !== 'none' ||
      activeCheck.spotting ||
      activeCheck.passingClots ||
      activeCheck.abdominalPain !== 'none' ||
      activeCheck.pelvicPainOneSided ||
      activeCheck.fever;

    const isMedium = 
      !isHigh && (
        activeCheck.vomiting === 'frequent' ||
        activeCheck.headache === 'moderate' ||
        activeCheck.dizziness === 'moderate' ||
        activeCheck.abdominalPain === 'moderate' ||
        activeCheck.spotting ||
        (activeCheck.prevMiscarriage && hasAnyCurrentSymptoms)
      );

    if (isHigh) {
      riskLevel = 'high';
      reasonText = t.highRiskExplanation || "High risk triage classification. Seek immediate medical care.";
    } else if (isMedium) {
      riskLevel = 'moderate';
      reasonText = t.mediumRiskExplanation || "Medium risk triage classification. Visit clinic within 24-48 hrs, consider ultrasound assessment, and follow up with a healthcare provider.";
    } else {
      riskLevel = 'low';
      reasonText = t.lowRiskExplanation || "Low risk triage classification. Continue monitoring, stay hydrated, attend routine ANC care, and repeat assessment if symptoms worsen.";
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
        pds303: activeCheck.prevMiscarriage ? "Yes" : "No",
        pds310: activeCheck.fever ? "Yes" : "No",
        pds324: Number(activeCheck.pregnancyWeek) <= 12 ? "<=12 weeks" : ">12 weeks",
        pds401: "Incomplete Abortion",
        pds402: (activeCheck.dizziness === 'severe' || activeCheck.heavyBleeding || activeCheck.abdominalPain === 'severe') ? "Yes" : "No",
        pds501: "Yes",
        pds502: "MVA",
        pds503: "Clinical Officer",
        pds505: "Yes",
        pds507: "Yes",
        pds509: "No",
        pds510: "No",
        pds701: "Yes",
        pds702: "Yes",
        pds801: (activeCheck.dizziness === 'severe' || activeCheck.heavyBleeding || activeCheck.abdominalPain === 'severe') ? "Referred / Admitted" : "Discharged well",
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
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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
        
        apiSuccess = true;
        
        apiData = {
          action: riskLevel === 'high' ? (t.recImmediateCare || 'Seek immediate medical care') : (riskLevel === 'moderate' ? (t.recVisitClinic2448 || 'Visit clinic within 24-48 hrs') : (t.recContinueMonitoring || 'Continue monitoring')),
          careGaps: riskLevel === 'high' 
            ? [t.recImmediateCare || 'Seek immediate medical care'] 
            : (riskLevel === 'moderate' 
                ? [t.recVisitClinic2448 || 'Visit clinic within 24-48 hrs', t.recConsiderUltrasound || 'Consider ultrasound assessment', t.recFollowUpProvider || 'Follow up with health care provider'] 
                : [t.recContinueMonitoring || 'Continue monitoring', t.recStayHydrated || 'Stay hydrated', t.recAttendAnc || 'Attend routine ANC Care', t.recRepeatAssessment || 'Repeat assessment if symptoms worsen']),
          equityFlags: result.equity_flags || [],
          mentalHealthFlag: result.mental_health_flag || false,
          mentalHealthNote: result.mental_health_note || "No immediate mental health concerns.",
          followUpRecommendation: riskLevel === 'high' ? 'Immediate clinical care required.' : (riskLevel === 'moderate' ? 'Clinic visit within 24-48 hours.' : 'Routine monitoring.'),
          prediction: predVal,
          probability: probVal
        };
      }
    } catch (e) {
      console.warn("EPL Care AI predict API failed, using rules logic:", e);
    }

    // 3. Apply rules logic if API call failed
    if (!apiSuccess) {
      const isHighRisk = riskLevel === 'high';
      const isModRisk = riskLevel === 'moderate';
      
      apiData = {
        action: isHighRisk ? (t.recImmediateCare || "Seek immediate medical care") : (isModRisk ? (t.recVisitClinic2448 || "Visit clinic within 24-48 hrs") : (t.recContinueMonitoring || "Continue monitoring")),
        careGaps: isHighRisk 
          ? [t.recImmediateCare || "Seek immediate medical care"] 
          : (isModRisk 
              ? [t.recVisitClinic2448 || "Visit clinic within 24-48 hrs", t.recConsiderUltrasound || "Consider ultrasound assessment", t.recFollowUpProvider || "Follow up with health care provider"] 
              : [t.recContinueMonitoring || "Continue monitoring", t.recStayHydrated || "Stay hydrated", t.recAttendAnc || "Attend routine ANC Care", t.recRepeatAssessment || "Repeat assessment if symptoms worsen"]),
        equityFlags: [],
        mentalHealthFlag: (mood !== null && mood <= 2),
        mentalHealthNote: (mood !== null && mood <= 2) ? "Patient flags emotional distress. Support group referral recommended." : "No immediate mental health risks flagged.",
        followUpRecommendation: isHighRisk ? "Immediate clinical care required." : (isModRisk ? "Clinic visit within 24-48 hours." : "Routine monitoring."),
        prediction: isHighRisk ? 1 : 0,
        probability: isHighRisk ? 0.95 : 0.45
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

    // Save locally
    const histRecord = {
      id: `Local-${Date.now()}`,
      timestamp: new Date().toISOString(),
      riskLevel: riskLevel === 'high' ? 'High' : (riskLevel === 'moderate' ? 'Medium' : 'Low'),
      text: updatedResult.text,
      action: apiData.action,
      careGaps: apiData.careGaps,
      equityFlags: apiData.equityFlags,
      mentalHealthFlag: apiData.mentalHealthFlag,
      mentalHealthNote: apiData.mentalHealthNote,
      followUpRecommendation: apiData.followUpRecommendation,
      symptoms: {
        pregnancyWeek: activeCheck.pregnancyWeek,
        location: activeCheck.location,
        nausea: activeCheck.nausea,
        vomiting: activeCheck.vomiting,
        headache: activeCheck.headache,
        dizziness: activeCheck.dizziness,
        spotting: activeCheck.spotting,
        abdominalPain: activeCheck.abdominalPain,
        heavyBleeding: activeCheck.heavyBleeding,
        passingClots: activeCheck.passingClots,
        pelvicPainOneSided: activeCheck.pelvicPainOneSided,
        fever: activeCheck.fever,
        prevMiscarriage: activeCheck.prevMiscarriage
      }
    };
    try {
      const localHist = JSON.parse(localStorage.getItem('carebridge_assessments_history') || '[]');
      localHist.unshift(histRecord);
      localStorage.setItem('carebridge_assessments_history', JSON.stringify(localHist));
    } catch (err) {
      console.warn("Failed to save local history log copy:", err);
    }

    // Save to Firestore (Non-blocking)
    try {
      setAssignedCHW(null);
      const docData = {
        patientName: session?.username || "Tomi",
        location: activeCheck.location || "Lagos Mainland",
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
      };

      addDoc(collection(db, 'assessments'), docData)
        .then(docRef => {
          setLastAssessmentId(docRef.id);
        })
        .catch(err => {
          console.warn("Failed to save assessment to Firestore:", err);
        });
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
          location: activeCheck.location || "Lagos",
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
      title: t.gestationalAgeStatus || "Gestational Age Status",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.pregnancyDuration || "Pregnancy Duration (Weeks)"}</span>
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
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide block">{t.pregnancyWeeks || "Weeks Gestation"}</span>
              </div>
              <button
                type="button"
                onClick={() => setHealthCheck(prev => ({ ...prev, pregnancyWeek: Math.min(42, prev.pregnancyWeek + 1) }))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                +
              </button>
            </div>
            
            <div className="flex flex-col gap-1 mt-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.selectLgaDistrict || "Select LGA/District"}</span>
              <select
                value={healthCheck.location || 'Lagos Mainland'}
                onChange={(e) => setHealthCheck(prev => ({ ...prev, location: e.target.value }))}
                className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0F4C81]/40 text-xs"
              >
                <option value="Lagos Mainland">Lagos Mainland</option>
                <option value="Ikeja">Ikeja</option>
                <option value="Lagos Island">Lagos Island</option>
                <option value="Surulere">Surulere</option>
                <option value="Ikorodu">Ikorodu</option>
              </select>
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold leading-normal mt-2.5">
              * Note: Gestational week directly affects clinical risk predictions.
            </p>
          </div>
        </div>
      )
    },
    {
      title: t.step1Title || "Gastrointestinal Symptoms",
      icon: Droplets,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">{t.nauseaLabel || "Experiencing Nausea?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, nausea: val }))}
                  className={`py-1 px-3.5 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.nausea === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-1.5 border-t border-slate-100/50 pt-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.vomitingLabel || "Vomiting Severity"}</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { k: 'none', l: t.vomitNone || 'None' },
                { k: 'mild', l: t.vomitMild || 'Mild' },
                { k: 'frequent', l: t.vomitFrequent || 'Frequent' },
                { k: 'food-down', l: t.vomitFoodDown || "Can't Keep Food Down" },
                { k: 'medication-down', l: t.vomitMedsDown || "Can't Keep Meds" }
              ].map(opt => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, vomiting: opt.k }))}
                  className={`py-2 px-2.5 text-[9px] font-black uppercase rounded-xl border transition-all ${healthCheck.vomiting === opt.k ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: t.step2Title || "Neurological Symptoms",
      icon: HeartPulse,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.headacheLabel || "Headache Severity"}</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { k: 'none', l: t.none || 'None' },
                { k: 'mild', l: t.mild || 'Mild' },
                { k: 'moderate', l: t.moderate || 'Moderate' },
                { k: 'severe', l: t.severe || 'Severe' }
              ].map(opt => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, headache: opt.k }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.headache === opt.k ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100/50 pt-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.dizzinessLabel || "Dizziness Severity"}</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { k: 'none', l: t.none || 'None' },
                { k: 'mild', l: t.mild || 'Mild' },
                { k: 'moderate', l: t.moderate || 'Moderate' },
                { k: 'severe', l: t.severe || 'Severe' }
              ].map(opt => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, dizziness: opt.k }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.dizziness === opt.k ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: t.step3Title || "Bleeding & Pain Symptoms",
      icon: Activity,
      content: (
        <div className="space-y-3">
          {/* Spotting */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">{t.spottingLabel || "Spotting?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, spotting: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.spotting === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
          </div>

          {/* Abdominal Pain */}
          <div className="space-y-1.5 border-t border-slate-100/50 pt-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t.abdominalPainLabel || "Abdominal Pain"}</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { k: 'none', l: t.none || 'None' },
                { k: 'mild', l: t.mild || 'Mild' },
                { k: 'moderate', l: t.moderate || 'Moderate' },
                { k: 'severe', l: t.severe || 'Severe' }
              ].map(opt => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, abdominalPain: opt.k }))}
                  className={`py-2 px-1 text-[10px] font-black uppercase rounded-xl border transition-all ${healthCheck.abdominalPain === opt.k ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Heavy Bleeding */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-3">
            <span className="text-xs font-bold text-slate-700">{t.heavyBleedingLabel || "Heavy Bleeding?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, heavyBleeding: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.heavyBleeding === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
          </div>

          {/* Passing Clots */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-3">
            <span className="text-xs font-bold text-slate-700">{t.passingClotsLabel || "Passing out Clots?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, passingClots: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.passingClots === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
          </div>

          {/* Pelvic Pain: One Sided */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-3">
            <span className="text-xs font-bold text-slate-700">{t.pelvicPainOneSidedLabel || "Pelvic Pain: One Sided?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, pelvicPainOneSided: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.pelvicPainOneSided === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: t.step4Title || "History & Vitals",
      icon: Thermometer,
      content: (
        <div className="space-y-3">
          {/* Fever */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-slate-700">{t.feverLabel || "Fever / Pyrexia?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, fever: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.fever === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
          </div>

          {/* Previous Miscarriage */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100/50 pt-3">
            <span className="text-xs font-bold text-slate-700">{t.prevMiscarriageLabel || "Previous Miscarriage?"}</span>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button
                  key={val ? 'yes' : 'no'}
                  type="button"
                  onClick={() => setHealthCheck(prev => ({ ...prev, prevMiscarriage: val }))}
                  className={`py-1 px-3 text-xs font-black uppercase rounded-lg border transition-all ${healthCheck.prevMiscarriage === val ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {val ? (t.yes || 'Yes') : (t.no || 'No')}
                </button>
              ))}
            </div>
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

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-[#0F4C81] text-[#0F4C81] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Recovery Dashboard
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            setPasscode('');
            setIsUnlocked(false);
            setPinError('');
            setPinSuccess('');
          }}
          className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-[#0F4C81] text-[#0F4C81] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShieldAlert size={12} />
          Private History Log
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <>
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
                        {assessmentResult.risk === 'high' ? (t.highRisk || 'HIGH RISK') :
                         assessmentResult.risk === 'moderate' ? (t.mediumRisk || 'MEDIUM RISK') :
                         (t.lowRisk || 'LOW RISK')}
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
                          <span className="text-[8.5px] text-slate-400 font-semibold block italic pt-1 border-t border-slate-100/50">
                            🛡️ Aligned with WHO Post-Abortion Care (PAC) Clinical Guidelines.
                          </span>
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[
                                  { id: 'chw-01', name: "Mary Adegoke", role: "Midwife Specialist", phone: "+234803001020" },
                                  { id: 'chw-02', name: "Chioma Okoye", role: "Obstetrics Lead", phone: "+234803998877" }
                                ].map(chw => (
                                  <div key={chw.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-[11px]">
                                    <div className="flex justify-between">
                                      <span className="font-extrabold text-slate-800 text-[10.5px]">{chw.name}</span>
                                      <span className="text-[7.5px] font-black text-slate-400 uppercase">{chw.role}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 leading-tight">Lagos Mainland Healthcare Center</p>
                                    <div className="flex gap-1.5 mt-1.5">
                                      <button 
                                        onClick={() => assignCHW(chw.id, chw.name)}
                                        className="flex-1 py-1 text-[8.5px] font-black bg-[#0F4C81] text-white rounded-lg hover:opacity-90 uppercase transition-all border-none cursor-pointer"
                                      >
                                        Assign
                                      </button>
                                      <button 
                                        onClick={() => alert(`Calling ${chw.name} at ${chw.phone}...`)}
                                        className="py-1 px-2 text-[8.5px] font-black bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg uppercase transition-all border border-slate-200 cursor-pointer"
                                      >
                                        Call
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Hospital Suggestions */}
                            <div className="border-t border-slate-200/80 pt-3.5 space-y-2">
                              <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">
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
                                  <div key={hosp.name} className="p-2.5 bg-rose-50/50 hover:bg-rose-50 rounded-xl border border-rose-100/80 flex flex-col gap-1 text-slate-800 shadow-xs transition-colors">
                                    <div className="flex justify-between items-center">
                                      <h5 className="font-black text-[10.5px] text-slate-800 truncate">{hosp.name}</h5>
                                      <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase border-none text-white ${
                                        hosp.urgency === 'Level 3' ? 'bg-rose-600' : 'bg-amber-500'
                                      }`}>
                                        {hosp.urgency}
                                      </span>
                                    </div>
                                    <p className="text-[8.5px] text-slate-500 font-extrabold uppercase tracking-wider">{hosp.distance} • {hosp.specialty}</p>
                                    <div className="flex gap-1.5 mt-1.5">
                                      <button
                                        type="button"
                                        onClick={() => alert(`Calling ${hosp.name}...`)}
                                        className="flex-1 py-1 text-[8px] font-black bg-[#0F4C81] text-white rounded-lg hover:opacity-90 transition-opacity uppercase tracking-wider cursor-pointer border-none"
                                      >
                                        Call
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => alert(`Mapping route to ${hosp.name} (${hosp.address})...`)}
                                        className="flex-1 py-1 text-[8px] font-black bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200 uppercase tracking-wider cursor-pointer"
                                      >
                                        Route
                                      </button>
                                    </div>
                                  </div>
                                ))}
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
              
              {/* Card 1: Inline Recovery Triage Wizard & Results Panel (Now comes first!) */}
              <Card className="p-6 border border-slate-100/80 rounded-[2.5rem] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.025)] space-y-5">
                {!assessmentResult ? (
                  // Questionnaire Wizard
                  modalStep === 'intro' ? (
                    <div className="space-y-5 text-center py-4">
                      <div className="w-14 h-14 bg-[#0F4C81]/10 rounded-2xl flex items-center justify-center text-[#0F4C81] mx-auto shadow-inner">
                        <HeartPulse size={30} className="animate-pulse" />
                      </div>
                      
                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Recovery Symptom Triage Test</h3>
                        <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                          Screen potential warning signs (hemorrhaging, pain, infection risks) and get real-time clinical guidance and emergency contacts.
                        </p>
                        <div className="text-[9.5px] text-slate-400 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center italic mt-2.5 leading-normal">
                          🛡️ Aligned with WHO Post-Abortion Care (PAC) Clinical Guidelines for Sub-Saharan Africa. The local rules engine cross-references secondary infection and hemorrhaging markers.
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                        <Button 
                          type="button"
                          onClick={() => {
                            setModalStep(0);
                            speakText("Starting guided health check. Step 1: Gestational age status.");
                          }}
                          className="w-full h-11 bg-gradient-to-r from-secondary to-[#1762a0] hover:opacity-95 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10.5px] cursor-pointer"
                        >
                          Begin Guided Screening
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            runRiskAssessment(true);
                          }}
                          variant="outline"
                          className="w-full h-11 border-slate-200 text-[#0F4C81] hover:bg-slate-50 font-extrabold rounded-xl uppercase tracking-wider text-[10.5px] cursor-pointer"
                        >
                          Direct AI Assessment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Progress Indicator */}
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Step {modalStep + 1} of {sections.length}</span>
                          <h4 className="text-sm font-black text-[#0F4C81]">{sections[modalStep].title}</h4>
                        </div>
                        
                        {/* Voice Assistant Buttons inside card */}
                        <div className="flex gap-1.5 items-center">
                          <button 
                            type="button"
                            onClick={() => playVoiceGuideForSection(modalStep)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all text-slate-500 hover:text-[#0F4C81] cursor-pointer ${
                              isSpeaking ? 'bg-[#0F4C81]/5 border-[#0F4C81]/15 text-[#0F4C81]' : 'bg-slate-50 border-slate-200/50'
                            }`}
                            title="Read instructions out loud"
                          >
                            <Volume2 size={13} className={isSpeaking ? 'animate-pulse' : ''} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => startSpeechRecognitionForSection(modalStep)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                              isListening ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse' : 'bg-slate-50 border-slate-200/50 text-slate-500'
                            }`}
                            title="Answer by voice"
                          >
                            <Mic size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Progressive bar indicator */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300" 
                          style={{ width: `${((modalStep + 1) / sections.length) * 100}%` }}
                        />
                      </div>

                      {/* Section Questions Content */}
                      <div className="p-4.5 bg-slate-50/70 rounded-2xl border border-slate-100/80 min-h-[140px] flex flex-col justify-center">
                        {sections[modalStep].content}
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex gap-2 pt-1">
                        {modalStep > 0 ? (
                          <Button
                            type="button"
                            onClick={() => setModalStep(modalStep - 1)}
                            variant="outline"
                            className="flex-1 h-10 border-slate-200 text-slate-600 font-extrabold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                          >
                            Back
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => setModalStep('intro')}
                            variant="outline"
                            className="flex-1 h-10 border-slate-200 text-slate-600 font-extrabold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                          >
                            Cancel
                          </Button>
                        )}
                        {modalStep < sections.length - 1 ? (
                          <Button
                            type="button"
                            onClick={() => setModalStep(modalStep + 1)}
                            className="flex-1 h-10 bg-[#0F4C81] hover:bg-[#0F4C81]/95 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                          >
                            Next Step
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => {
                              runRiskAssessment(false);
                              setModalStep('intro');
                            }}
                            className="flex-1 h-10 bg-secondary hover:bg-secondary/90 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] shadow-lg shadow-secondary/20 cursor-pointer"
                          >
                            Submit Test
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  // Completed Diagnostics Dashboard inside card!
                  <div className="space-y-4 py-2">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Triage Check-in Result</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Dynamic Diagnostic</p>
                        </div>
                      </div>
                      <Badge className={`uppercase text-[8.5px] font-black tracking-wider px-2.5 py-0.5 rounded-full border-none shadow-xs ${
                        assessmentResult.risk === 'high' 
                          ? 'bg-rose-600 text-white animate-pulse' 
                          : (assessmentResult.risk === 'moderate' 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-emerald-600 text-white')
                      }`}>
                        {assessmentResult.risk === 'high' ? (t.highRisk || 'HIGH RISK') :
                         assessmentResult.risk === 'moderate' ? (t.mediumRisk || 'MEDIUM RISK') :
                         (t.lowRisk || 'LOW RISK')}
                      </Badge>
                    </div>

                    <div className="space-y-3.5 text-slate-700">
                      <p className="text-[11.5px] leading-relaxed font-bold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {assessmentResult.text}
                      </p>

                      <div className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100/60 p-2 rounded-xl text-center font-bold italic leading-normal">
                        🛡️ Compliance: WHO Post-Abortion Care (PAC) Clinical Guidelines active.
                      </div>

                      {/* Expandable Obstetric Transport Dispatch Hub (simulated real-time tracking) */}
                      {(assessmentResult.risk === 'high' || assessmentResult.risk === 'moderate') && (
                        <div className="border border-rose-100 bg-rose-50/20 rounded-2xl p-4 space-y-3 shadow-inner">
                          <button
                            type="button"
                            onClick={() => setIsTransitExpanded(!isTransitExpanded)}
                            className="w-full flex justify-between items-center text-left cursor-pointer border-none bg-transparent"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-black text-rose-800 uppercase tracking-wider block">
                                🚨 Emergency Obstetric Transit Dispatch Hub
                              </span>
                            </div>
                            <span className="text-xs text-rose-600 font-bold">{isTransitExpanded ? 'Collapse Feed' : 'Expand Feed'}</span>
                          </button>

                          {isTransitExpanded && (
                            <div className="space-y-3 animate-fadeIn pt-1">
                              <div className="text-[10px] text-slate-600 font-semibold bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                                <span>Nearest Facility: <strong className="text-slate-800">Mainland General Hospital</strong></span>
                                <span className="text-rose-600 font-bold shrink-0 ml-2">3.8 km (9 mins)</span>
                              </div>

                              {/* Chat-thread dispatcher status log */}
                              <div className="relative border-l-2 border-rose-200/60 pl-3.5 ml-2 text-[10px] space-y-3">
                                {transitStep >= 0 && (
                                  <div className="relative animate-fadeIn">
                                    <div className="absolute -left-[18.5px] top-1 w-2 h-2 rounded-full bg-rose-600" />
                                    <p className="font-bold text-slate-700 leading-relaxed">
                                      <span className="text-slate-400 font-medium mr-1.5">[Triage Trigger]</span>
                                      Emergency warning flags confirmed (Hemorrhage/Sepsis screening complete).
                                    </p>
                                  </div>
                                )}
                                {transitStep >= 1 && (
                                  <div className="relative animate-fadeIn">
                                    <div className="absolute -left-[18.5px] top-1 w-2 h-2 rounded-full bg-rose-600" />
                                    <p className="font-bold text-slate-700 leading-relaxed">
                                      <span className="text-slate-400 font-medium mr-1.5">[Alert Logged]</span>
                                      Specialist supervisor alert routed to CHW Mary Adegoke.
                                    </p>
                                  </div>
                                )}
                                {transitStep >= 2 && (
                                  <div className="relative animate-fadeIn">
                                    <div className="absolute -left-[18.5px] top-1 w-2 h-2 rounded-full bg-rose-600" />
                                    <p className="font-bold text-slate-700 leading-relaxed">
                                      <span className="text-slate-400 font-medium mr-1.5">[Dispatch Sent]</span>
                                      Moto-Ambulance dispatch requested via local Rider Emergency Link.
                                    </p>
                                  </div>
                                )}
                                {transitStep >= 3 && (
                                  <div className="relative animate-fadeIn">
                                    <div className="absolute -left-[19.5px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                                    <div className="absolute -left-[19.5px] top-0.5 w-3 h-3 rounded-full bg-emerald-500" />
                                    <p className="font-black text-emerald-700 leading-relaxed">
                                      <span className="text-slate-400 font-medium mr-1.5">[Active Transit]</span>
                                      Joseph Bello assigned (Distance: 1.8km, Est. Arrival: 7 mins).
                                    </p>
                                  </div>
                                )}
                              </div>

                              {transitStep < 3 && (
                                <div className="flex items-center gap-1.5 text-[8.5px] text-rose-500/80 font-black uppercase tracking-widest pl-1 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                  Connecting dispatch systems in real-time...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Immediate Action Notice */}
                      {assessmentResult.action && (
                        <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-1 shadow-sm">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Clinical Action Required</span>
                          <p className="text-[10px] font-medium leading-relaxed text-slate-200">{assessmentResult.action}</p>
                        </div>
                      )}

                      {/* Care Gaps or Mental Health Flags summary */}
                      {assessmentResult.careGaps && assessmentResult.careGaps.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                          <span className="text-[8.5px] font-black text-amber-800 uppercase tracking-wider block">⚠️ Care Gaps Detected</span>
                          <p className="text-[10px] text-amber-900 font-semibold leading-tight">
                            {assessmentResult.careGaps[0]} (and {assessmentResult.careGaps.length - 1} more)
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1.5">
                        <Button
                          type="button"
                          onClick={() => {
                            setAssessmentResult(null);
                            setAssignedCHW(null);
                            setModalStep('intro');
                          }}
                          variant="outline"
                          className="flex-1 h-9 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-black uppercase text-[9px] tracking-wider rounded-xl cursor-pointer"
                        >
                          Retake Health Test
                        </Button>
                        {(assessmentResult.risk === 'high' || assessmentResult.risk === 'moderate') && (
                          <Button
                            type="button"
                            onClick={() => alert("Dialing maternal specialist contact...")}
                            className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[9px] tracking-wider rounded-xl shadow-md shadow-rose-100 cursor-pointer"
                          >
                            Call Specialist
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Card 2: Responsive Streak & Daily Vitals check-in Panel (Now comes second!) */}
              {(() => {
                const vitalsLoggedCount = (waterGlasses >= 8 ? 1 : waterGlasses / 8) + (mealEaten ? 1 : 0) + (medTaken ? 1 : 0);
                const completionPercent = Math.round((vitalsLoggedCount / 3) * 100);
                return (
                  <Card className="p-6 border border-slate-100/80 rounded-[2.5rem] bg-gradient-to-tr from-white via-slate-50/50 to-blue-50/20 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        Daily Care & Vitals Check-in
                      </h4>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Today's Vitals</span>
                    </div>

                    {/* Vitals Completion Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        <span>Logging Progress</span>
                        <span className="text-emerald-500 font-extrabold">{completionPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100/70 rounded-full overflow-hidden border border-slate-200/20">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 rounded-full transition-all duration-500" 
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Water Tracker */}
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between py-1">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                          <Droplets size={14} className="text-blue-500" /> Have you taken water?
                        </span>
                        <div className="flex flex-wrap gap-1.5 items-center justify-end">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(glass => (
                              <button
                                key={glass}
                                type="button"
                                onClick={() => setWaterGlasses(glass)}
                                className={`w-7 h-9 text-[10px] font-black rounded-lg flex flex-col items-center justify-between py-1 cursor-pointer transition-all border ${
                                  waterGlasses >= glass 
                                    ? 'bg-gradient-to-b from-blue-400 to-blue-600 text-white border-transparent shadow-[0_4px_12px_rgba(59,130,246,0.3)] scale-105' 
                                    : 'bg-slate-50 border-slate-200/40 text-slate-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200/40'
                                }`}
                                title={`${glass} Glass`}
                              >
                                <span className="text-[10px] select-none leading-none">💧</span>
                                <span className="text-[8px] font-extrabold tracking-tighter leading-none">{glass}</span>
                              </button>
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0 select-none">
                            {waterGlasses}/8
                          </span>
                        </div>
                      </div>

                      {/* Meals & Calories Tracker */}
                      <div className="flex items-center justify-between py-2 border-t border-slate-100/60">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Coffee size={14} className="text-amber-600" /> Taken nutrient meals today?
                        </span>
                        <div className="flex gap-2">
                          {[
                            { val: true, label: 'Yes', icon: CheckCircle2, activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] border-transparent' },
                            { val: false, label: 'No', icon: X, activeClass: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.25)] border-transparent' }
                          ].map(opt => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                setMealEaten(opt.val);
                                if (opt.val) setStreak(p => p + 1);
                              }}
                              className={`py-1.5 px-4 text-[10px] font-black uppercase rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                                mealEaten === opt.val
                                  ? opt.activeClass
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <opt.icon size={11} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prescribed supplements */}
                      <div className="flex items-center justify-between py-2 border-t border-slate-100/60">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Pill size={14} className="text-purple-600" /> Prescribed vitamins / meds taken?
                        </span>
                        <div className="flex gap-2">
                          {[
                            { val: true, label: 'Yes', icon: CheckCircle2, activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] border-transparent' },
                            { val: false, label: 'No', icon: X, activeClass: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.25)] border-transparent' }
                          ].map(opt => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => setMedTaken(opt.val)}
                              className={`py-1.5 px-4 text-[10px] font-black uppercase rounded-xl border flex items-center gap-1 cursor-pointer transition-all ${
                                medTaken === opt.val
                                  ? opt.activeClass
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`}
                            >
                              <opt.icon size={11} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Advice/Tips Section based on AI Assessment */}
                    <div className="mt-3 p-4 bg-slate-50/80 rounded-[1.75rem] border border-slate-100/80 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-[10.5px] uppercase tracking-wider">
                        <Sparkles size={13} className="text-secondary" />
                        AI Recovery Advice & Tips
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {getDynamicTips().map((tip, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-sm hover:scale-[1.01] transition-all">
                            <span className="block font-black text-slate-800 text-[10px] uppercase tracking-wider mb-1">{tip.title}</span>
                            <span className="block text-[10px] text-slate-500 leading-relaxed font-medium">{tip.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })()}

            </div>

            {/* Right Column: Reflections, AI Results, Emergency & Support */}
            <div className="lg:col-span-5 space-y-6">
              {!supportMessage ? (
                <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-8"
                >
                  <Card className="p-6 sm:p-10 border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_20px_50px_rgba(15,76,129,0.35)] relative overflow-hidden group">
                     <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-2xl font-black tracking-tight">Daily Symptom Log</h3>
                          <button 
                            type="button"
                            onClick={simulateVoiceSpeak}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSpeaking ? 'bg-secondary text-white shadow-lg' : 'bg-white/10 text-white/40 hover:bg-white/20'}`}
                          >
                            <Volume2 size={20} className={isSpeaking ? 'animate-pulse' : ''} />
                          </button>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed italic">"Log your physical symptoms and mood daily. Type freely; our clinical keyword scanner will automatically highlight tags."</p>
                        
                        <div className="flex justify-between items-center mb-10">
                          {[
                            { v: 1, icon: Frown, activeClass: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white ring-4 ring-rose-500/20 shadow-[0_8px_20px_rgba(244,63,94,0.4)]' },
                            { v: 2, icon: Meh, activeClass: 'bg-gradient-to-b from-amber-500 to-amber-600 text-white ring-4 ring-amber-500/20 shadow-[0_8px_20px_rgba(245,158,11,0.4)]' },
                            { v: 3, icon: Smile, activeClass: 'bg-gradient-to-b from-teal-500 to-teal-600 text-white ring-4 ring-teal-500/20 shadow-[0_8px_20px_rgba(20,184,166,0.4)]' },
                            { v: 4, icon: Heart, activeClass: 'bg-gradient-to-b from-pink-500 to-pink-600 text-white ring-4 ring-pink-500/20 shadow-[0_8px_20px_rgba(236,72,153,0.4)]' },
                            { v: 5, icon: Sparkles, activeClass: 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-slate-955 ring-4 ring-yellow-400/20 shadow-[0_8px_20px_rgba(234,179,8,0.45)]' }
                          ].map(m => (
                            <button
                              key={m.v}
                              type="button"
                              onClick={() => setMood(m.v)}
                              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center transition-all cursor-pointer ${
                                mood === m.v 
                                  ? m.activeClass + ' scale-110' 
                                  : 'bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 hover:scale-105'
                              }`}
                            >
                              <m.icon size={26} />
                            </button>
                          ))}
                        </div>

                        <div className="bg-slate-950/40 rounded-[2rem] p-6 mb-6 border border-white/5 focus-within:border-secondary/40 focus-within:ring-2 focus-within:ring-secondary/15 transition-all">
                          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-secondary mb-4">Daily Symptoms & Reflections</p>
                          <textarea
                            placeholder="Describe physical symptoms (e.g. bleeding, pelvic pain, headache, fever) or how you feel today..."
                            value={note}
                            onChange={(e) => {
                              setNote(e.target.value);
                              handleNoteChange(e.target.value);
                            }}
                            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-white/20 min-h-[120px] font-medium resize-none text-slate-200"
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
                                  className={`py-1.5 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1 cursor-pointer select-none ${
                                    isSelected 
                                      ? 'bg-[#0F4C81] border-[#0F4C81] text-white shadow-md shadow-[#0F4C81]/25' 
                                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/70 hover:scale-102'
                                  }`}
                                >
                                  {isSelected && <Check size={10} className="stroke-[3]" />}
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Button 
                          onClick={handleLog}
                          disabled={mood === null || loading}
                          className="w-full bg-gradient-to-r from-secondary to-[#1762a0] text-white hover:opacity-95 rounded-2xl h-12 font-black transition-all shadow-xl shadow-black/20 text-sm uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
                           <HeartPulse size={32} />
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
        </>
      ) : (
        /* Password-Protected History Log Panel */
        <div className="space-y-6 max-w-2xl mx-auto">
          {!isUnlocked ? (
            /* PIN Gate Screen */
            <Card className="p-8 border border-slate-100 rounded-[2.5rem] bg-white shadow-xl text-center space-y-6">
              <div className="w-16 h-16 bg-[#0F4C81]/10 rounded-[1.5rem] flex items-center justify-center text-[#0F4C81] mx-auto shadow-inner">
                <ShieldAlert size={36} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Clinical Records Shield</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  Enter your private 4-digit security PIN to view private diagnostics history and counselor referrals.
                </p>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Default PIN: 1234</p>
              </div>

              <div className="max-w-xs mx-auto space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full text-center text-2xl font-bold tracking-[1em] py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 placeholder:text-slate-300 text-slate-800"
                />
                
                {pinError && (
                  <p className="text-xs font-black text-rose-500 uppercase tracking-wide">
                    ⚠️ {pinError}
                  </p>
                )}

                <Button
                  onClick={() => {
                    if (passcode === securityPin) {
                      setIsUnlocked(true);
                      setPasscode('');
                      setPinError('');
                    } else {
                      setPinError('Incorrect Passcode PIN');
                    }
                  }}
                  className="w-full h-11 bg-gradient-to-r from-secondary to-[#1762a0] text-white font-extrabold rounded-xl uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Verify & Unlock
                </Button>
              </div>
            </Card>
          ) : (
            /* Unlocked History List Screen */
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2.5xl border border-slate-100/80">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Triage Diagnostics Log</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Passcode Unlocked</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsChangingPin(!isChangingPin);
                      setNewPin('');
                      setPinError('');
                      setPinSuccess('');
                    }}
                    className="h-8 rounded-xl font-bold text-[9px] uppercase border-slate-200 text-slate-600 cursor-pointer"
                  >
                    {isChangingPin ? 'Cancel' : 'Change PIN'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsUnlocked(false);
                      setIsChangingPin(false);
                    }}
                    className="h-8 rounded-xl font-bold text-[9px] bg-slate-900 text-white uppercase tracking-wider hover:bg-slate-800 cursor-pointer"
                  >
                    Lock View
                  </Button>
                </div>
              </div>

              {/* Pin Change Form */}
              {isChangingPin && (
                <Card className="p-5 border border-slate-100 rounded-2.5xl bg-white shadow-sm space-y-4 max-w-md mx-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Modify Privacy PIN</span>
                  <div className="space-y-3">
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="Enter New PIN"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center tracking-[0.5em] text-sm focus:outline-none placeholder:tracking-normal placeholder:text-xs text-slate-800"
                    />
                    {pinError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-wide">{pinError}</p>}
                    {pinSuccess && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">{pinSuccess}</p>}
                    <Button
                      onClick={() => {
                        if (newPin.length !== 4 || isNaN(Number(newPin))) {
                          setPinError('PIN must be 4 numbers');
                          setPinSuccess('');
                        } else {
                          localStorage.setItem('carebridge_privacy_pin', newPin);
                          setSecurityPin(newPin);
                          setPinSuccess('PIN updated');
                          setPinError('');
                          setTimeout(() => {
                            setIsChangingPin(false);
                            setPinSuccess('');
                          }, 1500);
                        }
                      }}
                      className="w-full h-9 bg-secondary text-white font-extrabold rounded-lg uppercase text-[9px] tracking-wider cursor-pointer"
                    >
                      Save PIN
                    </Button>
                  </div>
                </Card>
              )}

              {/* History Lists */}
              {(() => {
                const historyRaw = localStorage.getItem('carebridge_assessments_history');
                const historyList = historyRaw ? JSON.parse(historyRaw) : [];
                
                if (historyList.length === 0) {
                  return (
                    <Card className="p-8 border border-slate-100 rounded-2.5xl bg-white text-center space-y-3">
                      <p className="text-sm font-extrabold text-slate-700">No History Found</p>
                      <p className="text-xs text-slate-500">Run the triage check-in on the dashboard to log your first recovery report.</p>
                      <Button
                        onClick={() => setActiveTab('dashboard')}
                        className="bg-secondary text-white font-extrabold text-[10px] px-4 py-2 rounded-xl uppercase tracking-wider cursor-pointer"
                      >
                        Return to Dashboard
                      </Button>
                    </Card>
                  );
                }

                return (
                  <div className="space-y-4">
                    {historyList.map((item: any, idx: number) => (
                      <Card key={idx} className="p-5 border border-slate-100 rounded-[1.75rem] bg-white shadow-sm space-y-3 text-slate-700">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase">
                            📅 {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <Badge className={`uppercase text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full border-none text-white ${
                            item.riskLevel === 'High' 
                              ? 'bg-rose-600' 
                              : (item.riskLevel === 'Medium' 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-600')
                          }`}>
                            {item.riskLevel === 'High' ? (t.highRisk || 'HIGH RISK') :
                             item.riskLevel === 'Medium' ? (t.mediumRisk || 'MEDIUM RISK') :
                             (t.lowRisk || 'LOW RISK')}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed text-[11px]">
                            {item.text}
                          </p>

                          {item.symptoms && (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Logged Symptoms & Parameters</span>
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 text-slate-700 bg-white rounded-md">
                                  Week {item.symptoms.pregnancyWeek} Gestation
                                </Badge>
                                {item.symptoms.nausea && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 text-slate-700 bg-white rounded-md">
                                    Nausea
                                  </Badge>
                                )}
                                {item.symptoms.vomiting && item.symptoms.vomiting !== 'none' && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 text-slate-700 bg-white rounded-md">
                                    Vomiting: {item.symptoms.vomiting}
                                  </Badge>
                                )}
                                {item.symptoms.headache && item.symptoms.headache !== 'none' && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 text-slate-700 bg-white rounded-md">
                                    Headache: {item.symptoms.headache}
                                  </Badge>
                                )}
                                {item.symptoms.dizziness && item.symptoms.dizziness !== 'none' && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 text-slate-700 bg-white rounded-md">
                                    Dizziness: {item.symptoms.dizziness}
                                  </Badge>
                                )}
                                {item.symptoms.spotting && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-rose-200 text-rose-700 bg-rose-50/20 rounded-md">
                                    Spotting
                                  </Badge>
                                )}
                                {item.symptoms.heavyBleeding && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-rose-300 text-rose-800 bg-rose-50/50 rounded-md animate-pulse">
                                    🚨 Heavy Bleeding
                                  </Badge>
                                )}
                                {item.symptoms.passingClots && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-rose-300 text-rose-800 bg-rose-50/50 rounded-md">
                                    🚨 Passing Clots
                                  </Badge>
                                )}
                                {item.symptoms.abdominalPain && item.symptoms.abdominalPain !== 'none' && (
                                  <Badge variant="outline" className={`text-[8.5px] font-bold rounded-md ${
                                    item.symptoms.abdominalPain === 'severe' 
                                      ? 'border-rose-300 text-rose-800 bg-rose-50/50' 
                                      : 'border-slate-200 text-slate-700 bg-white'
                                  }`}>
                                    Pain: {item.symptoms.abdominalPain}
                                  </Badge>
                                )}
                                {item.symptoms.pelvicPainOneSided && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-rose-300 text-rose-800 bg-rose-50/50 rounded-md">
                                    🚨 One-Sided Pelvic Pain
                                  </Badge>
                                )}
                                {item.symptoms.fever && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-rose-300 text-rose-800 bg-rose-50/50 rounded-md">
                                    🚨 Fever
                                  </Badge>
                                )}
                                {item.symptoms.prevMiscarriage && (
                                  <Badge variant="outline" className="text-[8.5px] font-bold border-slate-200 text-slate-700 bg-white rounded-md">
                                    History of Miscarriage
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {item.action && (
                            <div className="p-3 bg-slate-900 text-white rounded-xl text-[10px] font-medium leading-relaxed">
                              <span className="text-[7.5px] font-black text-slate-400 uppercase block mb-0.5">Clinical Action Required</span>
                              {item.action}
                            </div>
                          )}

                          {item.careGaps && item.careGaps.length > 0 && (
                            <div className="text-[10px] font-extrabold text-slate-500">
                              ⚠️ Gaps: {item.careGaps.join(', ')}
                            </div>
                          )}

                          <div className="text-[8.5px] text-slate-400 font-semibold text-center pt-1 italic">
                            🛡️ Aligned with WHO Post-Abortion Care (PAC) clinical guidelines compliance.
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
