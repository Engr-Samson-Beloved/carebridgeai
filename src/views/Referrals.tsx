import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';
import { 
  MapPin, 
  Phone, 
  BadgeCheck, 
  DollarSign, 
  Clock, 
  AlertCircle,
  Search,
  Navigation as NavIcon,
  Star
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
interface ReferralsProps {
  language: Language;
}

export function Referrals({ language }: ReferralsProps) {
  const t = translations[language];
  const [notifiedClinics, setNotifiedClinics] = React.useState<string[]>([]);
  
  const notifyClinic = (name: string) => {
    setNotifiedClinics(prev => [...prev, name]);
  };

  const CLINICS = [
    {
      name: "City Maternal Care",
      distance: "2.4 km",
      address: "12 Medical Road, Ikeja",
      suitability: 98,
      affordability: "Medium",
      maternalCareReady: true,
      urgencyScore: "Level 3",
      specialties: ["EPAU", "Emergency OBGYN", "AI Ready"],
      matchReason: "Specialized EPAU unit available for immediate referral."
    },
    {
      name: "St. Jude Women’s Hosp.",
      distance: "5.1 km",
      address: "45 Unity Street, Surulere",
      suitability: 92,
      affordability: "High",
      maternalCareReady: true,
      urgencyScore: "Level 2",
      specialties: ["General OBGYN", "Post-loss Care"],
      matchReason: "High patient satisfaction for emotionally sensitive care."
    },
    {
      name: "African Unity Clinic",
      distance: "1.2 km",
      address: "8 Peace Crescent, Yaba",
      suitability: 84,
      affordability: "Low",
      maternalCareReady: false,
      urgencyScore: "Level 1",
      specialties: ["Community Health", "Triage"],
      matchReason: "Lowest travel time for non-acute stabilization."
    }
  ];

  return (
    <div className="px-4 sm:px-8 pb-40 pt-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t.referrals}</h2>
        <p className="text-slate-500 font-medium">CareBridge AI coordinates your clinical path based on urgency and accessibility.</p>
      </div>

      {/* Map Coordination Interface Preview */}
      <section className="mb-10">
        <div className="w-full h-48 bg-slate-100 rounded-[2.5rem] relative overflow-hidden border border-slate-200 shadow-inner">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#0F4C81_2px,transparent_2px)] [background-size:24px_24px]"></div>
           
           {/* Center pulse for patient */}
           <div className="absolute top-1/2 left-1/3 flex flex-col items-center">
              <motion.div 
                animate={{ scale: [1, 1.5, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-4 h-4 bg-[#0F4C81] rounded-full border-2 border-white shadow-lg"
              />
              <div className="mt-1 px-2 py-0.5 bg-white rounded-full shadow-sm text-[8px] font-black uppercase text-primary">Patient</div>
           </div>

           {/* Clinic pulses */}
           <div className="absolute top-1/4 right-1/4">
              <div className="w-4 h-4 bg-[#2EC4B6] rounded-full border-2 border-white shadow-lg" />
              <div className="mt-1 px-2 py-0.5 bg-[#2EC4B6] text-white rounded-full shadow-sm text-[8px] font-black uppercase">Clinic A</div>
           </div>

           <div className="absolute bottom-1/4 right-1/2">
              <div className="w-4 h-4 bg-[#2EC4B6] rounded-full border-2 border-white shadow-lg" />
              <div className="mt-1 px-2 py-0.5 bg-white text-slate-400 rounded-full shadow-sm text-[8px] font-black uppercase">Clinic B</div>
           </div>

           {/* Map Controls */}
           <div className="absolute bottom-4 left-4 flex gap-2">
              <Button size="icon" className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-600 hover:bg-white border-none p-0">
                 <Search size={14} />
              </Button>
              <Button size="icon" className="w-8 h-8 rounded-full bg-[#0F4C81] text-white shadow-md border-none p-0">
                 <NavIcon size={14} />
              </Button>
           </div>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">AI-Ranked Facilities</h4>
        {CLINICS.map((clinic, i) => (
          <motion.div
            key={clinic.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-white border">
              <div className="p-5 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-black text-xl text-slate-900 group-hover:text-[#0F4C81] transition-colors">{clinic.name}</h3>
                      {clinic.maternalCareReady && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0F4C81] rounded-full text-[9px] font-black uppercase tracking-wider">
                           <BadgeCheck size={12} />
                           Verified
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-sm font-bold">
                      <MapPin size={16} className="text-slate-300" />
                      {clinic.address}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-[#0F4C81] font-black text-2xl">{clinic.suitability}%</div>
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AI Match</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl mb-8 border border-slate-50 italic text-xs font-medium text-slate-600">
                  "{clinic.matchReason}"
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8 px-1 sm:px-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distance</span>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                       <Clock size={14} className="text-slate-300" />
                       {clinic.distance}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</span>
                    <Badge variant="outline" className={`mx-auto rounded-full text-[10px] h-6 ${
                       clinic.urgencyScore === 'Level 3' ? 'border-rose-200 bg-rose-50 text-rose-500' : 
                       clinic.urgencyScore === 'Level 2' ? 'border-orange-200 bg-orange-50 text-orange-500' :
                       'border-blue-200 bg-blue-50 text-primary'
                    }`}>
                       {clinic.urgencyScore}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affordability</span>
                    <div className="flex justify-end gap-1">
                      {[1, 2, 3].map(d => (
                        <DollarSign 
                          key={d}
                          size={14} 
                          className={d <= (clinic.affordability === 'Low' ? 1 : clinic.affordability === 'Medium' ? 2 : 3) ? 'text-slate-900 border-2 rounded-full border-slate-200 p-0.5' : 'text-slate-200'} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
                  {clinic.specialties.map(spec => (
                    <span key={spec} className="px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 whitespace-nowrap shadow-sm uppercase tracking-wider">
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button 
                    className={`flex-1 rounded-[1.25rem] h-14 gap-3 font-black text-lg shadow-xl shadow-blue-100 ${
                      notifiedClinics.includes(clinic.name) ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#0F4C81] hover:bg-[#0F4C81]/95'
                    }`}
                    onClick={() => {
                      if (!notifiedClinics.includes(clinic.name)) {
                        notifyClinic(clinic.name);
                        alert(`Notifying ${clinic.name} of incoming patient...`);
                      } else {
                        alert(`Dialing ${clinic.name}...`);
                      }
                    }}
                  >
                    {notifiedClinics.includes(clinic.name) ? (
                      <>
                        {t.clinicNotified || 'Clinic Notified'}
                        <BadgeCheck size={20} />
                      </>
                    ) : (
                      <>
                        Call Clinic
                        <Phone size={20} />
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="icon" className="w-14 h-14 rounded-2xl border-slate-200 text-slate-400 hover:text-[#0F4C81] transition-colors">
                     <Star size={20} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center p-8 bg-slate-900 rounded-[3rem] text-white">
         <h4 className="font-black text-xl mb-3 tracking-tight">Need Urgent Transfer?</h4>
         <p className="text-white/60 text-sm font-medium mb-8 leading-relaxed">Emergency coordination center is active. Smart routing will prioritize high-fidelity EPAU facilities.</p>
         <Button className="w-full h-14 bg-rose-500 hover:bg-rose-600 rounded-2xl font-black text-lg uppercase tracking-wider shadow-2xl shadow-rose-900/40">
            Activate Emergency Route
         </Button>
      </div>
    </div>
  );
}
