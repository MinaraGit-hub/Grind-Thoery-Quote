import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface FormStepProps {
  children: ReactNode;
  isActive: boolean;
  direction: number;
}

export function FormStep({ children, isActive, direction }: FormStepProps) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      {isActive && (
        <motion.div
          key={isActive ? "active" : "inactive"}
          custom={direction}
          initial={(d: number) => ({
            opacity: 0,
            y: d > 0 ? 50 : -50,
          })}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={(d: number) => ({
            opacity: 0,
            y: d > 0 ? -50 : 50,
          })}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.2 }
          }}
          className="w-full max-w-xl mx-auto"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
