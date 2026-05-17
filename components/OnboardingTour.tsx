"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Zap, Target, Package, Search, Rocket } from "lucide-react";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: Step[] = [
  {
    title: "Find Your Niche",
    description: "Start by picking a 'boring' legacy industry or describing a specific problem. AI will help you identify high-potential, underserved niches.",
    icon: <Target className="w-6 h-6" />,
    color: "#5ce6a0", // ms-green
  },
  {
    title: "Generate Signal",
    description: "Our engine analyzes market gaps and technical feasibility to generate 3 focused SaaS ideas with pre-calculated ROI estimates.",
    icon: <Zap className="w-6 h-6" />,
    color: "#ffc857", // ms-yellow
  },
  {
    title: "Deploy Launch Kits",
    description: "For any idea, generate a complete 'Launch Kit' including a production-ready Lovable.dev prompt, 4-week roadmap, and marketing copies.",
    icon: <Package className="w-6 h-6" />,
    color: "#a78bfa", // purple
  },
  {
    title: "Find First Customers",
    description: "Once your MVP is ready, use the 'Found Client' engine to find real local businesses in your niche to start your outreach immediately.",
    icon: <Search className="w-6 h-6" />,
    color: "#5ce6a0",
  },
  {
    title: "Ready for Launch",
    description: "You're all set. Stop overthinking and start building. The market rewards execution over ideas.",
    icon: <Rocket className="w-6 h-6" />,
    color: "#ffffff",
  }
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("ms_tour_seen");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const closeTour = () => {
    setIsOpen(false);
    localStorage.setItem("ms_tour_seen", "true");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTour}
            className="absolute inset-0 bg-ms-bg/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-ms-panel border border-ms-border p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Background Accent */}
            <div 
              className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none"
              style={{ backgroundColor: steps[currentStep].color }}
            />

            {/* Close Button */}
            <button 
              onClick={closeTour}
              className="absolute top-4 right-4 text-ms-text-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center">
              <motion.div 
                key={`icon-${currentStep}`}
                initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                className="w-16 h-16 flex items-center justify-center border-2 mb-6"
                style={{ borderColor: steps[currentStep].color, color: steps[currentStep].color }}
              >
                {steps[currentStep].icon}
              </motion.div>

              <motion.h3 
                key={`title-${currentStep}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-ms text-[20px] font-bold text-white mb-3 uppercase tracking-wider"
              >
                {steps[currentStep].title}
              </motion.h3>

              <motion.p 
                key={`desc-${currentStep}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="font-ms text-[14px] text-ms-text-light leading-[1.6] mb-8"
              >
                {steps[currentStep].description}
              </motion.p>

              {/* Progress Dots */}
              <div className="flex gap-2 mb-8">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1 transition-all duration-300 ${i === currentStep ? "w-6 bg-ms-green" : "w-2 bg-ms-border"}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex w-full gap-3">
                <button 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex-1 font-ms py-3 text-[12px] font-bold border border-ms-border flex items-center justify-center gap-2 transition-colors ${currentStep === 0 ? "opacity-0 pointer-events-none" : "text-ms-text-muted hover:text-white hover:border-ms-text-muted"}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </button>
                <button 
                  onClick={nextStep}
                  className="flex-[2] font-ms bg-ms-green py-3 text-[12px] font-bold text-ms-bg flex items-center justify-center gap-2 hover:bg-ms-green-dark transition-colors"
                >
                  {currentStep === steps.length - 1 ? "GET STARTED" : "NEXT"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Accent Line */}
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-ms-green"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
