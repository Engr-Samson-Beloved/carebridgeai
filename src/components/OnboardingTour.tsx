import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from "@/components/ui/button";
import { Sparkles, HelpCircle, X, ChevronRight } from 'lucide-react';

interface OnboardingTourProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

interface TourStep {
  elementId: string;
  title: string;
  text: string;
  position: 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
  {
    elementId: 'tour-language',
    title: 'Select Language',
    text: 'Click here to switch languages instantly. CareBridge supports English, Yoruba, Hausa, French, and Swahili.',
    position: 'bottom'
  },
  {
    elementId: 'tour-voice',
    title: 'Voice Guide Toggle',
    text: 'Activate the Voice Guide here to hear spoken guidance and instructions throughout the recovery test.',
    position: 'bottom'
  },
  {
    elementId: 'tour-sos',
    title: 'SOS Emergency Dispatch',
    text: 'In case of severe discomfort or bleeding, click this button to notify our team and request emergency clinical dispatch.',
    position: 'bottom'
  },
  {
    elementId: 'tour-start-triage',
    title: 'Start Recovery Test',
    text: 'Launch the AI clinical check-up here to assess danger signs and automatically link with a community specialist.',
    position: 'top'
  }
];

export function OnboardingTour({ step, onNext, onSkip }: OnboardingTourProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  const currentStep = TOUR_STEPS[step];

  // Update target element positions
  useEffect(() => {
    const updateCoordinates = () => {
      if (!currentStep) return;
      
      const element = document.getElementById(currentStep.elementId);
      if (element) {
        // Scroll the element into view if it is not visible (needed for start triage card on small screens)
        if (currentStep.elementId === 'tour-start-triage') {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Wait a brief moment for scroll to settle
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 100);
      } else {
        setCoords(null);
      }
    };

    updateCoordinates();
    window.addEventListener('resize', updateCoordinates);
    window.addEventListener('scroll', updateCoordinates);
    
    // Polling interval in case DOM layout shifts
    const interval = setInterval(updateCoordinates, 500);

    return () => {
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates);
      clearInterval(interval);
    };
  }, [step, currentStep]);

  if (!coords || !currentStep) return null;

  // Compute popover positions
  const popoverWidth = 290;
  const popoverHeight = 160; // Estimated height
  
  let popoverTop = 0;
  let popoverLeft = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, coords.left + coords.width / 2 - popoverWidth / 2));

  if (currentStep.position === 'bottom') {
    popoverTop = coords.top + coords.height + 12;
  } else {
    popoverTop = coords.top - popoverHeight - 20;
  }

  return (
    <div className="absolute inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Semi-transparent dark overlay with spotlight cutout */}
      <div 
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] pointer-events-auto"
        onClick={onSkip}
      />

      {/* Focus ring over targeted element */}
      <motion.div
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          top: coords.top - 6,
          left: coords.left - 6,
          width: coords.width + 12,
          height: coords.height + 12
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="absolute rounded-full border-3 border-primary bg-primary/5 shadow-[0_0_0_9999px_rgba(15,76,129,0.25)] pointer-events-auto ring-4 ring-primary/20 animate-pulse"
        style={{
          borderRadius: currentStep.elementId === 'tour-start-triage' ? '2.5rem' : '9999px'
        }}
      />

      {/* Glassmorphic Tooltip Popover */}
      <motion.div
        initial={{ opacity: 0, y: currentStep.position === 'bottom' ? 10 : -10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          top: popoverTop,
          left: popoverLeft
        }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="absolute w-[290px] bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2rem] p-5 pointer-events-auto flex flex-col gap-4 text-slate-800"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0F4C81]">
            <Sparkles size={12} className="animate-spin text-amber-500" style={{ animationDuration: '3s' }} />
            {currentStep.title}
          </span>
          <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
            Step {step + 1} of 4
          </span>
        </div>

        {/* Text */}
        <p className="text-xs text-slate-600 font-semibold leading-relaxed">
          {currentStep.text}
        </p>

        {/* Action Row */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100/60">
          <button 
            onClick={onSkip}
            className="text-[9.5px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest"
          >
            Skip
          </button>
          
          <Button 
            onClick={onNext}
            className="h-8 rounded-xl bg-[#0F4C81] hover:bg-[#0F4C81]/95 text-white font-black text-[9.5px] uppercase tracking-wider gap-1 px-3.5"
          >
            {step === 3 ? 'Finish Tour' : 'Next'}
            {step < 3 && <ChevronRight size={12} />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
