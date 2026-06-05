export enum RiskLevel {
  LOW = "Low",
  MODERATE = "Moderate",
  HIGH = "High",
}

export interface RiskAssessment {
  id: string;
  userId: string;
  timestamp: Date;
  pregnancyWeek: number;
  symptoms: {
    bleeding: number; // 0-3 scale
    abdominalPain: number; // 0-3 scale
    dizziness: boolean;
    fever: boolean;
    hypertension: boolean;
  };
  history: {
    priorMiscarriage: boolean;
    chronicConditions: string[];
  };
  riskScore: number;
  riskLevel: RiskLevel;
  aiExplanation: string;
}

export interface Referral {
  id: string;
  clinicName: string;
  distance: string;
  suitabilityScore: number;
  affordability: "Low" | "Medium" | "High";
  specialties: string[];
  maternalCareReady: boolean;
  address: string;
}

export interface RecoveryLog {
  id: string;
  userId: string;
  timestamp: Date;
  mood: number; // 1-5
  physicalState: string;
  emotionalNote: string;
}

export type AppView = "login" | "patient-dashboard" | "patient-assessment" | "patient-referrals" | "chw-dashboard" | "landing" | "assessment" | "referral" | "recovery" | "dashboard";

export type Language = 'en' | 'fr' | 'sw' | 'yo' | 'ha' | string;

export const ALL_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'sw', label: 'Swahili' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
  { code: 'zu', label: 'Zulu' },
  { code: 'xh', label: 'Xhosa' },
  { code: 'am', label: 'Amharic' },
  { code: 'om', label: 'Oromo' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'es', label: 'Spanish' },
  { code: 'so', label: 'Somali' },
  { code: 'sn', label: 'Shona' },
  { code: 'rw', label: 'Kinyarwanda' },
  { code: 'ny', label: 'Chichewa' },
  { code: 'ln', label: 'Lingala' },
  { code: 'mg', label: 'Malagasy' },
  { code: 'ti', label: 'Tigrinya' }
];

export interface UserPreferences {
  language: Language;
  whatsappEnabled: boolean;
  voiceGuided: boolean;
  emergencyContact?: string;
  chwMode?: boolean;
}

export interface UserSession {
  username: string;
  role: 'patient' | 'chw';
  chwId?: string;
}

export interface CHWProfile {
  id: string;
  name: string;
  location: string;
  onlineStatus: boolean;
  avatar: string;
}

export interface FirestoreNotification {
  id: string;
  chwId: string;
  patientName: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  message: string;
  readStatus: boolean;
  timestamp: string;
}

export interface CHWPatient {
  id: string;
  name: string;
  age: number;
  location: string;
  date: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  prediction: number;
  probability: number;
  action: string;
  careGaps: string[];
  equityFlags: string[];
  mentalHealthFlag: boolean;
  mentalHealthNote: string;
  followUpRecommendation: string;
  phone?: string;
  partnerName?: string;
  partnerPhone?: string;
  assignedCHWId?: string | null;
  assignedCHWName?: string | null;
  loggedByCHW?: string;
}


