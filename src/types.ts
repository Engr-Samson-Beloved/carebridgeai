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

export type AppView = "landing" | "assessment" | "referral" | "recovery" | "dashboard";

export type Language = 'en' | 'fr' | 'sw' | 'yo' | 'ha';

export interface UserPreferences {
  language: Language;
  whatsappEnabled: boolean;
  voiceGuided: boolean;
  emergencyContact?: string;
  chwMode?: boolean;
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
}


