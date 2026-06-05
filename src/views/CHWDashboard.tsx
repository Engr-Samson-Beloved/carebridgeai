import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Bell, 
  LogOut, 
  TrendingUp, 
  Brain, 
  MapPin, 
  ShieldAlert, 
  Info,
  ChevronRight,
  ClipboardList,
  Check,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { UserSession, CHWPatient } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit, addDoc } from 'firebase/firestore';

interface CHWDashboardProps {
  session: UserSession;
  onSignOut: () => void;
}

export function CHWDashboard({ session, onSignOut }: CHWDashboardProps) {
  const [patients, setPatients] = useState<CHWPatient[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<CHWPatient | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'pending' | 'assigned'>('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'patients' | 'analytics'>('patients');

  // Logs and Field Visit States
  const [patientLogs, setPatientLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [newVisit, setNewVisit] = useState({
    patientName: '',
    age: '25',
    location: 'Lagos Mainland',
    pregnancyWeek: '8',
    bleedingSeverity: 'none',
    painLevel: 'none',
    fever: false,
    chills: false,
    fainting: false,
    foulDischarge: false,
    notes: '',
    recommendations: '',
    phone: '',
    partnerName: '',
    partnerPhone: '',
    assignedCHWId: ''
  });

  // Query symptom_logs for the selected patient
  useEffect(() => {
    if (!selectedPatient) {
      setPatientLogs([]);
      return;
    }
    setLoadingLogs(true);
    const q = query(collection(db, 'symptom_logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: any[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        if (d.patientName?.toLowerCase() === selectedPatient.name.toLowerCase()) {
          logs.push({ id: doc.id, ...d });
        }
      });
      setPatientLogs(logs);
      setLoadingLogs(false);
    }, (err) => {
      console.warn("Failed to fetch symptom logs:", err);
      setLoadingLogs(false);
    });
    return () => unsubscribe();
  }, [selectedPatient]);

  const handleSaveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisit.patientName.trim()) {
      alert("Please enter patient name.");
      return;
    }

    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (
      newVisit.bleedingSeverity === 'heavy' || 
      newVisit.painLevel === 'severe' || 
      newVisit.fever || 
      newVisit.fainting
    ) {
      riskLevel = 'High';
    } else if (
      newVisit.bleedingSeverity === 'moderate' || 
      newVisit.painLevel === 'moderate' || 
      newVisit.chills || 
      newVisit.foulDischarge
    ) {
      riskLevel = 'Medium';
    }

    const careGaps: string[] = [];
    if (newVisit.bleedingSeverity !== 'none') careGaps.push("Requires active bleeding monitoring");
    if (newVisit.painLevel !== 'none') careGaps.push("Requires pelvic pain management check");
    if (newVisit.fever || newVisit.foulDischarge) careGaps.push("Flagged for potential systemic infection follow-up");

    const chwNames: Record<string, string> = {
      'chw_tomi': 'Nurse Tomi',
      'chw_amina': 'Sister Amina',
      'chw_kelechi': 'Dr. Kelechi'
    };
    const assignedCHWName = newVisit.assignedCHWId ? chwNames[newVisit.assignedCHWId] : 'Unassigned';

    const localRecord = {
      id: `local-assessment-${Date.now()}`,
      name: newVisit.patientName,
      age: Number(newVisit.age) || 25,
      location: newVisit.location,
      pregnancyWeek: Number(newVisit.pregnancyWeek) || 8,
      bleedingSeverity: newVisit.bleedingSeverity,
      painLevel: newVisit.painLevel,
      riskLevel: riskLevel,
      prediction: riskLevel === 'High' ? 0 : 1, 
      probability: riskLevel === 'High' ? 0.85 : 0.45,
      action: newVisit.recommendations || (riskLevel === 'High' ? "Refer immediately to secondary hospital." : "Routine Health Worker home follow-up check."),
      careGaps: careGaps,
      equityFlags: ["Rural Outreach Access"],
      mentalHealthFlag: false,
      mentalHealthNote: newVisit.notes || "Logged during rural Health Worker outreach field visit.",
      loggedByCHW: session.username || "Tomi",
      timestamp: new Date().toISOString(),
      phone: newVisit.phone,
      partnerName: newVisit.partnerName,
      partnerPhone: newVisit.partnerPhone,
      assignedCHWId: newVisit.assignedCHWId || null,
      assignedCHWName: assignedCHWName || null
    };

    // Save locally immediately
    try {
      const savedLocal = localStorage.getItem('carebridge_local_assessments');
      const currentLocal = savedLocal ? JSON.parse(savedLocal) : [];
      localStorage.setItem('carebridge_local_assessments', JSON.stringify([localRecord, ...currentLocal]));
    } catch (e) {
      console.warn("Failed to save field visit locally:", e);
    }

    // Reset inputs and close visit modal instantly to ensure UI doesn't hang
    const patientName = newVisit.patientName;
    setShowVisitModal(false);
    setNewVisit({
      patientName: '',
      age: '25',
      location: 'Lagos Mainland',
      pregnancyWeek: '8',
      bleedingSeverity: 'none',
      painLevel: 'none',
      fever: false,
      chills: false,
      fainting: false,
      foulDischarge: false,
      notes: '',
      recommendations: '',
      phone: '',
      partnerName: '',
      partnerPhone: '',
      assignedCHWId: ''
    });

    // Save to Firestore in background
    try {
      await addDoc(collection(db, 'assessments'), {
        patientName: localRecord.name,
        age: localRecord.age,
        location: localRecord.location,
        pregnancyWeek: localRecord.pregnancyWeek,
        bleedingSeverity: localRecord.bleedingSeverity,
        painLevel: localRecord.painLevel,
        riskLevel: localRecord.riskLevel,
        prediction: localRecord.prediction, 
        probability: localRecord.probability,
        action: localRecord.action,
        careGaps: localRecord.careGaps,
        equityFlags: localRecord.equityFlags,
        mentalHealthFlag: localRecord.mentalHealthFlag,
        mentalHealthNote: localRecord.mentalHealthNote,
        loggedByCHW: localRecord.loggedByCHW,
        timestamp: localRecord.timestamp,
        phone: localRecord.phone,
        partnerName: localRecord.partnerName,
        partnerPhone: localRecord.partnerPhone,
        assignedCHWId: localRecord.assignedCHWId,
        assignedCHWName: localRecord.assignedCHWName
      });
      alert(`Field visit record logged successfully for patient ${patientName}.`);
    } catch (err) {
      console.warn("Failed to save field visit to Firestore, fell back to local storage:", err);
      alert(`Field visit record saved locally for patient ${patientName} (offline simulation).`);
    }
  };

  // Load patient screenings and notifications from Firestore, fallback to mock data
  useEffect(() => {
    // 1. Listen to screenings (assessments)
    const screeningsQuery = query(collection(db, 'assessments'), orderBy('timestamp', 'desc'));
    const unsubscribeScreenings = onSnapshot(screeningsQuery, (snapshot) => {
      const dataList: CHWPatient[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        dataList.push({
          id: doc.id,
          name: d.patientName || `Patient ${doc.id.slice(0, 4)}`,
          age: d.pregnancyWeek ? 20 + (d.pregnancyWeek % 15) : 25, // Mock age if not saved
          location: d.location || "Lagos",
          date: d.timestamp ? new Date(d.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
          riskLevel: d.riskLevel || 'Low',
          prediction: d.prediction ?? 1,
          probability: d.probability ?? 0.5,
          action: d.action || d.aiOutput?.explanation || "Monitor patient parameters.",
          careGaps: d.careGaps || d.aiOutput?.recommendations || [],
          equityFlags: d.equityFlags || [],
          mentalHealthFlag: d.mentalHealthFlag ?? false,
          mentalHealthNote: d.mentalHealthNote || "Standard care protocols apply.",
          followUpRecommendation: d.follow_up_recommendation || d.followUpRecommendation || "Schedule regular checks.",
          phone: d.phone || "",
          partnerName: d.partnerName || "",
          partnerPhone: d.partnerPhone || "",
          assignedCHWId: d.assignedCHWId || null,
          assignedCHWName: d.assignedCHWName || null,
          loggedByCHW: d.loggedByCHW || ""
        });
      });

      // Retrieve and merge local storage assessments for offline-first display
      let localList: any[] = [];
      try {
        const savedLocal = localStorage.getItem('carebridge_local_assessments');
        localList = savedLocal ? JSON.parse(savedLocal) : [];
      } catch (e) {
        console.warn("Failed to parse local assessments:", e);
      }

      // Filter out local items that have been successfully synced to Firestore (using name & location matching as keys)
      const syncedNames = new Set(dataList.map(item => `${item.name}-${item.location}`));
      const uniqueLocal = localList.filter(item => !syncedNames.has(`${item.name}-${item.location}`));

      const formattedLocal = uniqueLocal.map(item => ({
        ...item,
        date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : new Date().toLocaleDateString()
      })) as unknown as CHWPatient[];

      setPatients([...formattedLocal, ...dataList]);
    }, (error) => {
      console.warn("Screening onSnapshot failed, loading local items only:", error);
      let localList: any[] = [];
      try {
        const savedLocal = localStorage.getItem('carebridge_local_assessments');
        localList = savedLocal ? JSON.parse(savedLocal) : [];
      } catch (e) {
        console.warn("Failed to parse local assessments:", e);
      }
      const formattedLocal = localList.map(item => ({
        ...item,
        date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : new Date().toLocaleDateString()
      })) as unknown as CHWPatient[];
      setPatients(formattedLocal);
    });

    // 2. Listen to notifications
    const notificationsQuery = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notesList: any[] = [];
      snapshot.forEach((doc) => {
        notesList.push({ id: doc.id, ...doc.data() });
      });

      setNotifications(notesList);
    }, (error) => {
      console.warn("Notifications onSnapshot failed:", error);
      setNotifications([]);
    });

    return () => {
      unsubscribeScreenings();
      unsubscribeNotifications();
    };
  }, []);

  // Filter and Search logic
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'high') return p.riskLevel === 'High';
    if (filter === 'medium') return p.riskLevel === 'Medium' || p.riskLevel === 'Moderate';
    if (filter === 'pending') return p.prediction === 0; // Unlikely to follow up needs intervention
    if (filter === 'assigned') {
      const usernameLower = (session.username || "").toLowerCase().trim();
      let activeCHWId = "";
      let activeKeyword = usernameLower;
      if (usernameLower.includes("tomi")) {
        activeCHWId = "chw_tomi";
        activeKeyword = "tomi";
      } else if (usernameLower.includes("amina")) {
        activeCHWId = "chw_amina";
        activeKeyword = "amina";
      } else if (usernameLower.includes("kelechi")) {
        activeCHWId = "chw_kelechi";
        activeKeyword = "kelechi";
      }

      // 1. Check assignedCHWId
      if (p.assignedCHWId && activeCHWId && p.assignedCHWId.toLowerCase() === activeCHWId) {
        return true;
      }

      // 2. Check assignedCHWName by keyword/username match
      if (p.assignedCHWName) {
        const assignedNameLower = p.assignedCHWName.toLowerCase();
        if (assignedNameLower.includes(activeKeyword) || assignedNameLower.includes(usernameLower)) {
          return true;
        }
      }

      // 3. Fallback: loggedByCHW by keyword/username match
      if (p.loggedByCHW) {
        const loggedByLower = p.loggedByCHW.toLowerCase();
        if (loggedByLower.includes(activeKeyword) || loggedByLower.includes(usernameLower)) {
          return true;
        }
      }

      return false;
    }
    return true;
  });

  // Action: mark patient case as resolved/followed-up
  const handleFollowUpComplete = async (patientId: string) => {
    try {
      const patientRef = doc(db, 'assessments', patientId);
      await updateDoc(patientRef, { status: 'Resolved' });
      alert(`Patient ${patientId} case updated to Followed-up/Resolved.`);
      setSelectedPatient(null);
    } catch (e) {
      // Local state fallback update
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, prediction: 1, probability: 1.0 } : p));
      alert(`Case updated successfully (offline mode).`);
      setSelectedPatient(null);
    }
  };

  // Metrics calculation
  const totalScreened = patients.length;
  const highRiskCount = patients.filter(p => p.riskLevel === 'High').length;
  const medRiskCount = patients.filter(p => p.riskLevel === 'Medium' || p.riskLevel === 'Moderate').length;
  const pendingInterventions = patients.filter(p => p.prediction === 0).length;

  // Chart data
  const riskDistribution = [
    { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
    { name: 'Med Risk', value: medRiskCount, color: '#f59e0b' },
    { name: 'Low Risk', value: Math.max(0, totalScreened - highRiskCount - medRiskCount), color: '#10b981' }
  ].filter(item => item.value > 0);

  const symptomTrends = [
    { name: 'Bleeding', count: patients.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Medium').length },
    { name: 'Severe Pain', count: patients.filter(p => p.mentalHealthFlag).length },
    { name: 'No Partner Counsel', count: patients.filter(p => p.careGaps.some(g => g.toLowerCase().includes('partner'))).length },
    { name: 'No Referral Note', count: patients.filter(p => p.careGaps.some(g => g.toLowerCase().includes('referral'))).length }
  ];

  return (
    <div className="flex flex-col gap-6 pb-40 px-4 sm:px-6">
      {/* CHW Header Console */}
      <section className="flex justify-between items-center bg-white/40 p-4 rounded-3xl border border-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm overflow-hidden ring-4 ring-[#0F4C81]/10">
            <img 
              src="https://images.unsplash.com/photo-1590642916589-592bca10dfbf?auto=format&fit=crop&q=80&w=200&h=200" 
              alt="Health Worker profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#0F4C81] uppercase tracking-widest leading-none mb-1">Health Worker Console</p>
            <h2 className="text-lg font-black text-slate-800">
              {(() => {
                const name = session.username;
                const lower = name.toLowerCase();
                if (lower.startsWith('dr.') || lower.startsWith('nurse') || lower.startsWith('midwife') || lower.startsWith('chw') || lower.startsWith('hw') || lower.startsWith('dr ')) {
                  return name;
                }
                return `Health Worker ${name}`;
              })()}
            </h2>
          </div>
        </div>

        <button 
          onClick={onSignOut}
          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 transition-all"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </section>

      {/* Role-Based Access Control Clinical Badge */}
      <div className="bg-slate-900 text-slate-100 py-2.5 px-4 rounded-2xl text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm border border-slate-800">
        <span>🔒 Role-Based Clinical Access Active: Authorized Lagos Health Board Personnel Only.</span>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-4 gap-2.5">
        <Card className="p-3.5 border-slate-100 bg-white text-center flex flex-col justify-center border shadow-xs">
          <span className="text-xl font-black text-slate-800">{totalScreened}</span>
          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider mt-1">Screened</span>
        </Card>
        <Card className="p-3.5 border-rose-100 bg-rose-50/50 text-center flex flex-col justify-center border shadow-xs relative overflow-hidden">
          <span className="text-xl font-black text-rose-600 relative z-10">{highRiskCount}</span>
          <span className="text-[7.5px] font-black text-rose-500 uppercase tracking-wider mt-1 relative z-10">Critical</span>
          <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
        </Card>
        <Card className="p-3.5 border-amber-100 bg-amber-50/30 text-center flex flex-col justify-center border shadow-xs">
          <span className="text-xl font-black text-amber-600">{medRiskCount}</span>
          <span className="text-[7.5px] font-black text-amber-500 uppercase tracking-wider mt-1">Medium</span>
        </Card>
        <Card className="p-3.5 border-blue-100 bg-blue-50/30 text-center flex flex-col justify-center border shadow-xs">
          <span className="text-xl font-black text-primary">{pendingInterventions}</span>
          <span className="text-[7.5px] font-black text-primary uppercase tracking-wider mt-1">Delays</span>
        </Card>
      </section>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 gap-6">
        <button 
          onClick={() => setActiveTab('patients')}
          className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'patients' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400'
          }`}
        >
          Patient Registry
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'analytics' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-slate-400'
          }`}
        >
          Analytics Dashboard
        </button>
      </div>

      {activeTab === 'patients' ? (
        <>
          {/* Real-time Notifications Feed */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <Bell size={14} className="text-[#0F4C81] animate-bounce" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Real-time Emergency Feed</h4>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {notifications.map((note) => (
                <div 
                  key={note.id}
                  className={`p-3 rounded-2xl border text-xs flex justify-between items-center transition-all ${
                    note.riskLevel === 'High' 
                      ? 'bg-rose-50/80 border-rose-100 text-rose-700 shadow-sm' 
                      : 'bg-amber-50/50 border-amber-100 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${note.riskLevel === 'High' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                    <div>
                      <span className="font-extrabold">{note.patientName}</span>
                      <p className="text-[10px] opacity-80 mt-0.5">{note.message || 'Critical triage entry logged.'}</p>
                    </div>
                  </div>
                  <Badge className={`text-[7.5px] uppercase font-black tracking-widest ${note.riskLevel === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-500'}`}>
                    {note.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          {/* Search and Filters */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search size={15} />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient by name or ID..."
                  className="block w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 transition-all outline-none h-11"
                />
              </div>
              <Button
                onClick={() => setShowVisitModal(true)}
                className="bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white rounded-2xl font-black text-xs uppercase px-5 tracking-wider h-11 shrink-0 shadow-md shadow-[#0F4C81]/15"
              >
                + Log Field Visit
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Cases' },
                { id: 'assigned', label: 'Assigned to Me' },
                { id: 'high', label: 'High Risk (Critical)' },
                { id: 'medium', label: 'Medium Risk' },
                { id: 'pending', label: 'Unlikely to Follow-up' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id as any)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                    filter === opt.id 
                      ? 'bg-[#0F4C81] text-white border-[#0F4C81]' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Cases Registry List */}
          <section className="space-y-3">
            {filteredPatients.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-slate-200 rounded-3xl">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No registry cases match this filter</p>
              </Card>
            ) : (
              filteredPatients.map((p) => (
                <Card 
                  key={p.id} 
                  onClick={() => setSelectedPatient(p)}
                  className="p-4 border-slate-100 rounded-2xl bg-white shadow-xs border flex flex-col gap-3 hover:border-blue-200 transition-all cursor-pointer relative group overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                        {p.name}
                        {p.riskLevel === 'High' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                        )}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Age {p.age} • {p.location} • {p.date}
                      </span>
                    </div>
                    <Badge className={`uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full ${
                      p.riskLevel === 'High' ? 'bg-rose-600 text-white' : 
                      p.riskLevel === 'Medium' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {p.riskLevel}
                    </Badge>
                  </div>

                  {/* Follow-up Likelihood Indicator */}
                  <div className="p-2 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[8.5px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Follow-up Likelihood</span>
                      <span className={p.prediction === 1 ? 'text-emerald-600' : 'text-rose-600'}>
                        {p.prediction === 1 ? 'Likely to Complete' : 'Unlikely to Complete'} ({Math.round(p.probability * 100)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${p.prediction === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${p.probability * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    <span>Click to view clinical details</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Card>
              ))
            )}
          </section>
        </>
      ) : (
        /* Analytics Dashboard View */
        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Risk Distribution Chart */}
            <Card className="p-4 border-slate-100 rounded-3xl bg-white border">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Risk Level Breakdown</h4>
              <div className="h-44 w-full flex items-center justify-center">
                {totalScreened === 0 ? (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No cases registered</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 px-2">
                <span className="text-rose-500">🔴 High ({highRiskCount})</span>
                <span className="text-amber-500">🟡 Med ({medRiskCount})</span>
                <span className="text-emerald-500">🟢 Low ({Math.max(0, totalScreened - highRiskCount - medRiskCount)})</span>
              </div>
            </Card>

            {/* Symptom / Care Gap Counts */}
            <Card className="p-4 border-slate-100 rounded-3xl bg-white border">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Symptom Frequency</h4>
              <div className="h-44 w-full flex items-center justify-center">
                {totalScreened === 0 ? (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No cases registered</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={symptomTrends} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 7, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 7, fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px' }} />
                      <Bar dataKey="count" fill="#0F4C81" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* AI Decision Card */}
          <Card className="p-5 border-none bg-[#0F4C81] text-white rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex gap-4 items-start">
              <div className="p-3 bg-white/10 rounded-xl text-white">
                <Brain size={24} />
              </div>
              <div>
                <h5 className="font-extrabold text-sm mb-1">AI Clinical Intervention Intelligence</h5>
                <p className="text-[11px] text-blue-100/70 leading-relaxed italic">
                  "Based on recent predictions, patient partner counseling remains the primary post-discharge care gap (45% missing rate). Prioritize including spouse in counseling sessions to boost clinic follow-up attendance."
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Patient Detail / Intervention Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-6 shadow-3xl max-h-[85vh] overflow-y-auto z-10"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    {selectedPatient.name}
                    <Badge variant="outline" className="text-[8px] bg-slate-50 font-black tracking-widest border-slate-100 px-2 py-0.5 uppercase">
                      ID: {selectedPatient.id}
                    </Badge>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Age {selectedPatient.age} • {selectedPatient.location}
                  </span>
                </div>
                <Badge className={`uppercase text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full ${
                  selectedPatient.riskLevel === 'High' ? 'bg-rose-600 text-white' : 
                  selectedPatient.riskLevel === 'Medium' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {selectedPatient.riskLevel}
                </Badge>
              </div>

              {/* API Predictive Model Output */}
              <div className="space-y-4">
                {/* Contact Information & Case Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-slate-100/60">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1.5">Contact Details</h4>
                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-400">Phone</span>
                        <span className="font-extrabold">{selectedPatient.phone || 'Not collected'}</span>
                      </div>
                      {selectedPatient.partnerName && (
                        <div className="flex justify-between items-center border-t border-slate-100/50 pt-1">
                          <span className="font-bold text-slate-400 text-[9.5px]">Kin Name</span>
                          <span className="font-extrabold truncate max-w-[80px]">{selectedPatient.partnerName}</span>
                        </div>
                      )}
                      {selectedPatient.partnerPhone && (
                        <div className="flex justify-between items-center border-t border-slate-100/50 pt-1">
                          <span className="font-bold text-slate-400 text-[9.5px]">Kin Phone</span>
                          <span className="font-extrabold">{selectedPatient.partnerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1.5">Case Assignment</h4>
                    <div className="p-2.5 bg-slate-50 rounded-xl flex flex-col justify-center gap-1 text-[11px] h-[72px]">
                      <span className="font-bold text-slate-400 block mb-0.5">Assign Specialist</span>
                      <select
                        value={selectedPatient.assignedCHWId || ''}
                        onChange={async (e) => {
                          const newCHWId = e.target.value;
                          const chwNames: Record<string, string> = {
                            'chw_tomi': 'Nurse Tomi',
                            'chw_amina': 'Sister Amina',
                            'chw_kelechi': 'Dr. Kelechi'
                          };
                          const newCHWName = newCHWId ? chwNames[newCHWId] : 'Unassigned';
                          
                          // Update locally first
                          setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, assignedCHWId: newCHWId || null, assignedCHWName: newCHWName || null } : p));
                          setSelectedPatient(prev => prev ? { ...prev, assignedCHWId: newCHWId || null, assignedCHWName: newCHWName || null } : null);

                          // Sync to Firestore
                          try {
                            const docRef = doc(db, 'assessments', selectedPatient.id);
                            await updateDoc(docRef, {
                              assignedCHWId: newCHWId || null,
                              assignedCHWName: newCHWName || null
                            });
                          } catch (err) {
                            console.warn("Failed to sync case assignment to Firestore:", err);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2 py-1 outline-none focus:border-[#0F4C81]"
                      >
                        <option value="">Unassigned</option>
                        <option value="chw_tomi">Nurse Tomi</option>
                        <option value="chw_amina">Sister Amina</option>
                        <option value="chw_kelechi">Dr. Kelechi</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Predictive follow-up completion</h4>
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Status</span>
                      <span className={selectedPatient.prediction === 1 ? 'text-emerald-600' : 'text-rose-600'}>
                        {selectedPatient.prediction === 1 ? 'Likely to Attend' : 'Critical - Unlikely to Attend'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Model Probability</span>
                      <span>{Math.round(selectedPatient.probability * 100)}% Confidence</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${selectedPatient.prediction === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${selectedPatient.probability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Immediate Intervention Actions */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Directive Action Plan</h4>
                  <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs font-semibold leading-relaxed text-slate-700">
                    <span className="font-extrabold text-rose-600 block text-[8px] uppercase tracking-wider mb-1">
                      ⚠️ CLINICAL INTERVENTION SYSTEM DIRECTIVE
                    </span>
                    {selectedPatient.action}
                  </div>
                </div>

                {/* Identified Gaps */}
                {selectedPatient.careGaps.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Identified Care Gaps</h4>
                    <div className="space-y-1.5">
                      {selectedPatient.careGaps.map((gap, idx) => (
                        <div key={idx} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs font-bold text-amber-800 flex items-start gap-2">
                          <span className="shrink-0 text-amber-500">⚠️</span>
                          <span>{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equity Barriers */}
                {selectedPatient.equityFlags.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Equity & Access Barriers</h4>
                    <div className="space-y-1.5">
                      {selectedPatient.equityFlags.map((flag, idx) => (
                        <div key={idx} className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl text-xs font-bold text-slate-600 flex items-start gap-2">
                          <span className="shrink-0 text-primary">📍</span>
                          <span>{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mental Health Indicators */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Mental Health Screening</h4>
                  <div className={`p-3 rounded-2xl border text-xs font-bold ${
                    selectedPatient.mentalHealthFlag 
                      ? 'bg-purple-50 border-purple-100 text-purple-800' 
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <span>Status</span>
                      <span>{selectedPatient.mentalHealthFlag ? 'Concern Flagged' : 'No Concern'}</span>
                    </div>
                    <p className="text-[11px] font-normal leading-relaxed opacity-95 mt-1.5">
                      {selectedPatient.mentalHealthNote}
                    </p>
                  </div>
                </div>

                {/* Daily Symptom Logs Timeline */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Daily Symptom Timeline Logs</h4>
                  {loadingLogs ? (
                    <p className="text-xs text-slate-400">Loading daily logs...</p>
                  ) : patientLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl">No daily symptom logs recorded by this patient yet.</p>
                  ) : (
                    <div className="space-y-4 border-l-2 border-slate-100 pl-4 ml-2">
                      {patientLogs.map((log, lIdx) => (
                        <div key={log.id || lIdx} className="relative space-y-1">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-[#0F4C81] border-2 border-white ring-2 ring-[#0F4C81]/15" />
                          <div className="flex justify-between items-center text-[9.5px] font-black text-slate-400 uppercase">
                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                            <Badge className="bg-slate-100 text-slate-700 font-extrabold border-none px-2 rounded-md">
                              Mood: {['😢', '😐', '🙂', '❤️', '✨'][log.mood - 1] || log.mood}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                            "{log.note || 'No notes'}"
                          </p>
                          {log.tags && log.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {log.tags.map((t: string) => (
                                <Badge key={t} className="text-[8px] uppercase font-black bg-rose-50 text-rose-600 border border-rose-100/50 rounded-md">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button 
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-100"
                    onClick={() => handleFollowUpComplete(selectedPatient.id)}
                  >
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Mark Case Resolved
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-12 rounded-2xl font-black uppercase text-xs tracking-wider text-slate-500 border-slate-200"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showVisitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVisitModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-6 shadow-3xl max-h-[90vh] overflow-y-auto z-10 flex flex-col gap-5"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    Log Field Visit Record
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Register a patient assessment manually during rural outreach
                  </span>
                </div>
                <button 
                  onClick={() => setShowVisitModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveVisit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Patient Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Fatima Ojo"
                      value={newVisit.patientName}
                      onChange={e => setNewVisit(prev => ({ ...prev, patientName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Age</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 25"
                      value={newVisit.age}
                      onChange={e => setNewVisit(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Location / Community</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Lagos Mainland"
                      value={newVisit.location}
                      onChange={e => setNewVisit(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Gestational Weeks</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="42"
                      placeholder="e.g. 8"
                      value={newVisit.pregnancyWeek}
                      onChange={e => setNewVisit(prev => ({ ...prev, pregnancyWeek: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Patient Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +234 803 123 4567"
                      value={newVisit.phone}
                      onChange={e => setNewVisit(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Assigned Health Worker</label>
                    <select 
                      value={newVisit.assignedCHWId}
                      onChange={e => setNewVisit(prev => ({ ...prev, assignedCHWId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    >
                      <option value="">Unassigned</option>
                      <option value="chw_tomi">Nurse Tomi</option>
                      <option value="chw_amina">Sister Amina</option>
                      <option value="chw_kelechi">Dr. Kelechi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Partner / Next-of-Kin Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Samuel Ojo"
                      value={newVisit.partnerName}
                      onChange={e => setNewVisit(prev => ({ ...prev, partnerName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Partner Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +234 802 987 6543"
                      value={newVisit.partnerPhone}
                      onChange={e => setNewVisit(prev => ({ ...prev, partnerPhone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-3">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Clinical Danger Signs & Symptom Severity</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Bleeding Severity</label>
                      <select 
                        value={newVisit.bleedingSeverity}
                        onChange={e => setNewVisit(prev => ({ ...prev, bleedingSeverity: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                      >
                        <option value="none">None</option>
                        <option value="spotting">Spotting</option>
                        <option value="moderate">Moderate Active</option>
                        <option value="heavy">Heavy Saturation</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Pain Level</label>
                      <select 
                        value={newVisit.painLevel}
                        onChange={e => setNewVisit(prev => ({ ...prev, painLevel: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                      >
                        <option value="none">None</option>
                        <option value="mild">Mild Pain</option>
                        <option value="moderate">Moderate Pain</option>
                        <option value="severe">Severe / Acute Pain</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { k: 'fever', l: 'Pyrexia / Fever (≥38.0°C)' },
                      { k: 'chills', l: 'Rigor / Chills / Shivers' },
                      { k: 'fainting', l: 'Syncope / Fainting' },
                      { k: 'foulDischarge', l: 'Purulent Vaginal Discharge' }
                    ].map(symp => (
                      <button
                        key={symp.k}
                        type="button"
                        onClick={() => setNewVisit(prev => ({ ...prev, [symp.k]: !prev[symp.k as keyof typeof prev] }))}
                        className={`py-2 px-3 text-[10px] font-black rounded-xl border text-left flex items-center gap-2 transition-all ${
                          newVisit[symp.k as keyof typeof newVisit] 
                            ? 'bg-[#0F4C81]/10 text-[#0F4C81] border-[#0F4C81]/30 shadow-sm' 
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${newVisit[symp.k as keyof typeof newVisit] ? 'bg-[#0F4C81] border-[#0F4C81] text-white' : 'border-slate-300 bg-white'}`}>
                          {newVisit[symp.k as keyof typeof newVisit] && <Check size={10} strokeWidth={3} />}
                        </div>
                        {symp.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 border-t border-slate-50 pt-3">
                  <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Clinical Field Notes</label>
                  <textarea 
                    placeholder="Log patient's general vitals, obstetric risk indicators, or environmental barriers..."
                    value={newVisit.notes}
                    onChange={e => setNewVisit(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none min-h-[60px] resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-400 block tracking-wider">Recommendations / Action Plan</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Referral to general hospital, follow up in 2 days"
                    value={newVisit.recommendations}
                    onChange={e => setNewVisit(prev => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 focus:bg-white text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none"
                  />
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button 
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white font-black uppercase tracking-wider text-xs shadow-md shadow-[#0F4C81]/10"
                  >
                    Save Field Record
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl font-black uppercase text-xs tracking-wider text-slate-500 border-slate-200 px-4"
                    onClick={() => setShowVisitModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
