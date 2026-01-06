import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function CircularProgress({
  currentStep,
  totalSteps = 4,
  className = "",
}: StepProgressProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1;
        const isCompleted = currentStep > stepNumber;
        const isActive = currentStep === stepNumber;

        return (
          <div key={i} className="flex items-center">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted 
                    ? "bg-[#6B5E51] border-[#6B5E51] text-white" 
                    : isActive 
                      ? "border-[#6B5E51] text-[#6B5E51] bg-white/5" 
                      : "border-[#6B5E51]/20 text-[#6B5E51]/40"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
            </div>
            {i < totalSteps - 1 && (
              <div 
                className={`w-12 h-[2px] mx-2 transition-colors duration-300 ${
                  isCompleted ? "bg-[#6B5E51]" : "bg-[#6B5E51]/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
