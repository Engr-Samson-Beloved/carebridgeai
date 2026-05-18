import React from 'react';
import { motion } from 'motion/react';
import { Language, UserPreferences } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Map as MapIcon,
  AlertCircle,
  Clock,
  ArrowUpRight,
  LayoutDashboard
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RISK_DATA = [
  { name: 'Low', value: 45, color: '#10b981' },
  { name: 'Moderate', value: 30, color: '#f59e0b' },
  { name: 'High', value: 25, color: '#ef4444' },
];

const TREND_DATA = [
  { month: 'Jan', assessments: 120, delays: 45 },
  { month: 'Feb', assessments: 180, delays: 38 },
  { month: 'Mar', assessments: 250, delays: 32 },
  { month: 'Apr', assessments: 320, delays: 25 },
  { month: 'May', assessments: 450, delays: 18 },
];

const SYMPTOM_DATA = [
  { name: 'Bleeding', count: 85 },
  { name: 'Pain', count: 65 },
  { name: 'Hypertension', count: 42 },
  { name: 'Fever', count: 28 },
];

const LANGUAGE_DATA = [
  { name: 'English', value: 40, color: '#0F4C81' },
  { name: 'French', value: 20, color: '#2EC4B6' },
  { name: 'Swahili', value: 25, color: '#FF9F1C' },
  { name: 'Yoruba', value: 10, color: '#FF6B6B' },
  { name: 'Hausa', value: 5, color: '#2563eb' },
];

interface DashboardProps {
  language: Language;
  prefs: UserPreferences;
}

export function Dashboard({ language, prefs }: DashboardProps) {
  return (
    <div className="px-8 pb-32">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Public Health Intelligence</h2>
        <p className="text-slate-500 font-medium">Monitoring maternal care impact and risk distribution across African sectors.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card className="p-8 border-none bg-[#0F4C81] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
                <Users size={24} className="text-blue-100/40" />
                <ArrowUpRight size={20} className="text-blue-100/40" />
            </div>
            <div className="text-4xl font-black mb-1">1,284</div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/40">Registered Cases</div>
           </div>
           <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none">
              <Users size={120} />
           </div>
        </Card>
        <Card className="p-8 border-none bg-[#2EC4B6] text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
                <Activity size={24} className="text-teal-100/40" />
                <TrendingUp size={20} className="text-teal-100/40" />
            </div>
            <div className="text-4xl font-black mb-1">82%</div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-100/40">Care Continuity</div>
           </div>
           <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none">
              <Activity size={120} />
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <Card className="p-6 border-slate-100 rounded-3xl bg-emerald-50/50">
          <div className="text-2xl font-black text-emerald-600 mb-1">94%</div>
          <div className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">WhatsApp Retention</div>
        </Card>
        <Card className="p-6 border-slate-100 rounded-3xl bg-rose-50/50">
          <div className="text-2xl font-black text-rose-600 mb-1">12s</div>
          <div className="text-[9px] font-black uppercase text-rose-500 tracking-widest">Avg SOS Response</div>
        </Card>
      </div>

      <div className="space-y-10">
        <Card className="p-10 border-slate-200 rounded-[3rem] shadow-sm bg-white">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Regional Language Usage</h3>
              <Badge variant="outline" className="rounded-full bg-slate-50 text-[10px] uppercase font-black tracking-widest px-4 border-slate-100">Across 5 Sectors</Badge>
           </div>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={LANGUAGE_DATA}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {LANGUAGE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="flex flex-wrap justify-between gap-4 mt-12 bg-slate-50 p-6 rounded-[2.5rem]">
              {LANGUAGE_DATA.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="text-sm font-black text-slate-800">{item.value}%</div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.name}</div>
                  </div>
                </div>
              ))}
           </div>
        </Card>

        <Card className="p-10 border-slate-200 rounded-[3rem] shadow-sm bg-white">
           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Intervention Rate</h3>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <defs>
                    <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0F4C81" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={12} />
                  <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.2)'}} />
                  <Area type="monotone" dataKey="assessments" stroke="#0F4C81" strokeWidth={5} fillOpacity={1} fill="url(#colorAssessments)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <div className="p-10 bg-[#FF6B6B] rounded-[3rem] text-white shadow-2xl shadow-red-900/20 relative overflow-hidden group">
           <div className="relative z-10">
              <div className="flex items-center gap-5 mb-6">
                 <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-lg border border-white/10">
                    <AlertCircle size={32} />
                 </div>
                 <h4 className="font-black text-2xl tracking-tighter">Critical Care Gap</h4>
              </div>
              <p className="text-sm text-red-100 leading-relaxed mb-8 font-medium italic">
                "AI detects a 34% increase in referral delays in North-Western districts. Immediate clinic resourcing recommended to prevent capacity failure."
              </p>
              <div className="flex gap-4">
                 <Button className="flex-1 h-14 bg-white text-rose-500 font-black rounded-2xl shadow-xl shadow-red-900/10 uppercase tracking-widest text-xs">
                    Deploy Resources
                 </Button>
                 <Button variant="ghost" className="h-14 border border-white/20 text-white font-black rounded-2xl px-8 hover:bg-white/10 uppercase tracking-widest text-xs">
                    Full Sector Analysis
                 </Button>
              </div>
           </div>
           {/* Decorative background element */}
           <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity">
              <LayoutDashboard size={200} />
           </div>
        </div>
      </div>
    </div>
  );
}
