import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Sparkles,
  MapPin,
  HeartPulse
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateChatResponse } from '../lib/gemini';
import { AppView, Language } from '../types';

interface ChatbotProps {
  language: Language;
  onNavigate: (view: AppView) => void;
  username?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  navigationTarget?: string | null;
  actions?: { type: string; payload: any }[] | null;
}

export function Chatbot({ language, onNavigate, username }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hello ${username || 'Tomi'}, I am your CareBridge AI companion. I am trained to support your post-pregnancy loss recovery and reproductive health journey across Sub-Saharan Africa. Ask me anything, or tap one of the shortcuts below.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [username]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Speech Synthesis (Speak bot response)
  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Voice Mode typing)
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice recognition is not supported on this browser.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputValue(resultText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // Format history for the API call
    const chatHistory = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role,
        text: m.text
      }));

    const result = await generateChatResponse(chatHistory, text);

    const modelMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'model',
      text: result.replyText,
      timestamp: new Date(),
      navigationTarget: result.navigationTarget,
      actions: result.actions
    };

    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);

    // Speak bot response out loud if enabled
    speakText(result.replyText);

    // Handle intent-based navigation command
    if (result.navigationTarget) {
      setTimeout(() => {
        onNavigate(result.navigationTarget as AppView);
        // Small local notification inside chat bubble
        setMessages(prev => [...prev, {
          id: `msg-${Date.now() + 2}`,
          role: 'model',
          text: `🔄 CareBridge: Navigated you to the requested section.`,
          timestamp: new Date()
        }]);
      }, 1500);
    }

    // Handle action execution via event dispatching
    if (result.actions && Array.isArray(result.actions)) {
      result.actions.forEach((act: any) => {
        console.log("Broadcasting carebridge action:", act.type, act.payload);
        window.dispatchEvent(new CustomEvent('carebridge-action', {
          detail: { type: act.type, data: act.payload }
        }));
      });
    }
  };

  const suggestionChips = [
    { label: "📍 Clinics near me", prompt: "Show me nearest support clinics" },
    { label: "📋 Start health check", prompt: "I want to start my recovery symptoms test" },
    { label: "❤️ Log daily symptoms", prompt: "I want to log my daily symptoms" },
    { label: "⚠️ What are danger signs?", prompt: "What are early pregnancy loss danger signs?" }
  ];

  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-[100] font-sans flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[360px] h-[450px] md:h-[550px] max-h-[calc(100vh-160px)] bg-slate-950/95 border border-slate-800 text-white rounded-[2.5rem] shadow-[0_24px_50px_-12px_rgba(15,76,129,0.4)] backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/25">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">CareBridge AI Companion</h4>
                  <span className="text-[9px] text-emerald-400 font-extrabold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Sub-Saharan Support
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${speechEnabled ? 'text-primary' : 'text-slate-500'}`}
                  title="Toggle Voice Synthesizer"
                >
                  {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg) => {
                const isModel = msg.role === 'model';
                return (
                  <div key={msg.id} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-normal font-medium shadow-xs border ${
                      isModel 
                        ? 'bg-slate-950/60 border-slate-800/80 text-slate-100 rounded-tl-xs' 
                        : 'bg-[#0F4C81] border-blue-900 text-white rounded-tr-xs'
                    }`}>
                      {msg.text}

                      {/* Conversational UI: Rich Clinic recommendation card */}
                      {isModel && msg.navigationTarget === 'referral' && (
                        <Card className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-white">
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest block">Featured Outreach Clinics</span>
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2 text-[10.5px]">
                              <MapPin size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-extrabold block text-slate-100">CareBridge Support Facility</span>
                                <span className="text-slate-400 text-[9.5px]">Outreach Referral Area (Free PAC Consultation)</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => onNavigate('referral')}
                            className="w-full h-7 text-[9px] font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white rounded-lg border-none"
                          >
                            Open Maps Directory
                          </Button>
                        </Card>
                      )}

                      {/* Conversational UI: Quick symptoms check launch card */}
                      {isModel && msg.navigationTarget === 'recovery' && (
                        <Card className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-white">
                          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Symptoms Check-up</span>
                          <p className="text-[10px] text-slate-400 font-medium">Verify bleeding severities, cramping intensity, and vitals thresholds.</p>
                          <Button 
                            onClick={() => onNavigate('recovery')}
                            className="w-full h-7 text-[9px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-lg border-none"
                          >
                            Launch Health Test
                          </Button>
                        </Card>
                      )}

                      {/* Conversational UI: Health Worker selection card */}
                      {isModel && (msg.actions?.some(a => a.type === 'ASSIGN_CHW') || msg.text.toLowerCase().includes('nurse tomi') || msg.text.toLowerCase().includes('sister amina')) && (
                        <Card className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-white">
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest block">Available Health Workers</span>
                          <div className="space-y-2">
                            {[
                              { id: 'chw_tomi', name: 'Nurse Tomi', location: 'Lagos Mainland PAC Dept', avatar: 'https://images.unsplash.com/photo-1590642916589-592bca10dfbf?auto=format&fit=crop&q=80&w=100&h=100' },
                              { id: 'chw_amina', name: 'Sister Amina', location: 'Ikeja Health Center', avatar: 'https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=100&h=100' },
                              { id: 'chw_kelechi', name: 'Dr. Kelechi', location: 'Surulere PAC Outreach', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100&h=100' }
                            ].map((chw) => (
                              <div 
                                key={chw.id}
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('carebridge-action', {
                                    detail: { type: 'ASSIGN_CHW', data: { chwId: chw.id, chwName: chw.name } }
                                  }));
                                  // Add local chat notification
                                  setMessages(prev => [...prev, {
                                    id: `msg-${Date.now() + 5}`,
                                    role: 'model',
                                    text: `✅ CareBridge: CHW ${chw.name} has been selected to follow up on your case.`,
                                    timestamp: new Date()
                                  }]);
                                }}
                                className="p-2 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex items-center justify-between cursor-pointer bg-slate-950/40 hover:bg-slate-950/80"
                              >
                                <div className="flex items-center gap-2">
                                  <img src={chw.avatar} alt={chw.name} className="w-6 h-6 rounded-full object-cover border border-slate-800" />
                                  <div>
                                    <span className="font-extrabold text-[10px] text-slate-200 block leading-none">{chw.name}</span>
                                    <span className="text-[7.5px] text-slate-400 font-bold uppercase">{chw.location}</span>
                                  </div>
                                </div>
                                <span className="text-[8.5px] font-black text-primary px-2 py-0.5 rounded bg-blue-900/20 hover:bg-blue-900/40">Select</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      <span className="block text-[8px] opacity-40 mt-1.5 text-right font-black uppercase tracking-wider">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl rounded-tl-xs text-xs text-slate-400 flex items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={14} />
                    <span>CareBridge is analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Form Section */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
              {/* Suggestion Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none whitespace-nowrap">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="py-1.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2 items-center bg-white/5 border border-white/10 focus-within:border-[#0F4C81]/40 rounded-2xl px-3 py-1.5 transition-colors">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                    placeholder="Ask CareBridge AI..."
                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-white/20 font-medium border-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={startSpeechRecognition}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${isListening ? 'bg-primary/20 text-primary animate-pulse' : 'text-slate-400 hover:text-white'}`}
                    title="Speak your message"
                  >
                    <Mic size={14} />
                  </button>
                </div>
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || loading}
                  className="w-9 h-9 rounded-2xl bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-900/20 border-none"
                >
                  <Send size={13} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-[#0F4C81] to-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/25 cursor-pointer relative z-50 border-none outline-none"
        title="Open CareBridge Companion"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageSquare size={24} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0F4C81] animate-ping" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
