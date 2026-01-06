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
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? "rgb(var(--card))" : "transparent",
                  borderColor: isCompleted || isActive ? "rgb(var(--card))" : "rgba(var(--card), 0.2)",
                  color: isCompleted ? "white" : isActive ? "rgb(var(--card))" : "rgba(var(--card), 0.4)",
                }}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300 bg-[#6f6052] text-[#eae0d7]"
                style={{
                   borderColor: "hsl(var(--primary))",
                   backgroundColor: isCompleted ? "hsl(var(--primary))" : "transparent",
                   color: isCompleted ? "hsl(var(--secondary))" : isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </motion.div>
            </div>
            {i < totalSteps - 1 && (
              <div 
                className="w-12 h-[2px] mx-2"
                style={{ backgroundColor: isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
