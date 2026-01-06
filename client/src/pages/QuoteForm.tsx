import { useState, useMemo } from "react";
import { useSettings, useCreateSubmission } from "@/hooks/use-form-data";
import { CircularProgress } from "@/components/CircularProgress";
import { FormStep } from "@/components/FormStep";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    hours: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const createSubmission = useCreateSubmission();
  const { toast } = useToast();

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  // Calculate live cost
  const calculatedCost = useMemo(() => {
    if (!settings || !formData.hours) return 0;
    
    // Check specific hourly rate first, fallback to base rate calculation
    const specificRate = settings.hourlyRates[formData.hours as keyof typeof settings.hourlyRates];
    if (specificRate) return specificRate;
    
    // Fallback: base_rate * hours
    return settings.baseRate * parseInt(formData.hours);
  }, [settings, formData.hours]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.mobileNumber) {
        toast({
          title: "Required fields missing",
          description: "Please fill in your name and mobile number.",
          variant: "destructive",
        });
        return;
      }
      // Simple mobile validation
      if (formData.mobileNumber.length < 8) {
         toast({
          title: "Invalid Number",
          description: "Please enter a valid mobile number.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.hours) {
      toast({
        title: "Selection required",
        description: "Please select the number of hours.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSubmission.mutateAsync({
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        hours: parseInt(formData.hours),
        calculatedCost: calculatedCost,
      });
      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="bg-card p-8 md:p-12 rounded-3xl shadow-2xl border border-border/50 max-w-lg w-full"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Quote Received!</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Thank you, {formData.fullName}. We have received your request for {formData.hours} hours.
            Our team will contact you shortly at {formData.mobileNumber}.
          </p>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Estimated Quote</p>
            <p className="text-4xl font-bold text-primary">${calculatedCost}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 text-primary font-medium hover:underline"
          >
            Start a new quote
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 -z-10" />

      {/* Header / Progress */}
      <header className="px-6 py-8 md:px-12 md:py-10 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">Q</div>
           <span className="font-bold text-xl tracking-tight hidden sm:block">QuickQuote</span>
        </div>
        <CircularProgress percentage={progress} size={56} strokeWidth={4} />
      </header>

      {/* Main Form Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-3xl mx-auto">
        
        {/* Step 1: Contact Info */}
        <FormStep isActive={step === 1} direction={direction}>
          <div className="space-y-12">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Let's get started. <br />
                <span className="text-muted-foreground font-normal">What should we call you?</span>
              </h1>
            </div>

            <div className="space-y-8">
              <div className="group">
                <label className="block text-sm font-semibold text-primary uppercase tracking-wider mb-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Type your full name here..."
                  className="input-field"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-primary uppercase tracking-wider mb-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="Enter your mobile number..."
                  className="input-field"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
              </div>
            </div>
          </div>
        </FormStep>

        {/* Step 2: Hours & Quote */}
        <FormStep isActive={step === 2} direction={direction}>
          <div className="space-y-12">
             <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                How much time do you need? <br />
                <span className="text-muted-foreground font-normal">We'll calculate the cost instantly.</span>
              </h1>
            </div>

            <div className="relative">
              <select
                className="input-field appearance-none cursor-pointer"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              >
                <option value="" disabled>Select hours...</option>
                {/* Dynamically generate options from settings if available, or static range */}
                {Object.keys(settings?.hourlyRates || {}).map((h) => (
                    <option key={h} value={h}>{h} Hours</option>
                ))}
                {/* Fallback extra options using base rate */}
                {[5, 6, 7, 8].map(h => (
                   <option key={h} value={h}>{h} Hours</option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Live Quote Display */}
            <motion.div 
               className="bg-white rounded-2xl p-6 shadow-xl border border-border/50 flex items-center justify-between"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Estimated Cost</p>
                <p className="text-xs text-muted-foreground mt-1">Based on {formData.hours || 0} hours</p>
              </div>
              <div className="text-right">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={calculatedCost}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-4xl md:text-5xl font-bold text-primary"
                  >
                    ${calculatedCost}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </FormStep>
      </main>

      {/* Footer Navigation */}
      <footer className="px-6 py-8 md:px-12 flex justify-end items-center max-w-7xl mx-auto w-full gap-4">
        {step > 1 && (
           <button 
             onClick={handleBack}
             className="px-6 py-3 rounded-xl font-semibold text-foreground hover:bg-black/5 transition-colors"
           >
             Back
           </button>
        )}
        
        <button
          onClick={step === totalSteps ? handleSubmit : handleNext}
          disabled={createSubmission.isPending}
          className="group relative px-8 py-4 bg-foreground text-background rounded-xl text-lg font-bold shadow-lg shadow-foreground/20 hover:shadow-xl hover:-translate-y-1 hover:bg-foreground/90 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          {createSubmission.isPending ? (
            <span className="flex items-center gap-2">Processing... <Loader2 className="w-5 h-5 animate-spin"/></span>
          ) : (
            <>
              {step === totalSteps ? "Get Quote" : "Next Step"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
