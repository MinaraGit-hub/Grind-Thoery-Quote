import { useState, useMemo } from "react";
import { useSettings, useCreateSubmission } from "@/hooks/use-form-data";
import { CircularProgress } from "@/components/CircularProgress";
import { FormStep } from "@/components/FormStep";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Untitled-1_1767674078681.png";

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

  const totalSteps = 2; // Logic still uses 2 steps
  const displaySteps = 4; // UI shows 4 steps to match image

  const calculatedCost = useMemo(() => {
    if (!settings || !formData.hours) return 0;
    const specificRate = settings.hourlyRates[formData.hours as keyof typeof settings.hourlyRates];
    if (specificRate) return specificRate;
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
          className="bg-card p-12 rounded-3xl shadow-2xl max-w-lg w-full text-card-foreground"
        >
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Success!</h2>
          <p className="opacity-80 text-lg mb-8">
            Thank you, {formData.fullName}. Quote received.
          </p>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-sm uppercase tracking-widest opacity-60 mb-1">Total</p>
            <p className="text-5xl font-bold">${calculatedCost}</p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 opacity-60 hover:opacity-100 transition-opacity">
            Start Over
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-6 overflow-hidden">
      {/* Progress Bar */}
      <CircularProgress currentStep={step} totalSteps={displaySteps} className="mb-12" />

      {/* Main Card */}
      <div className="w-full max-w-5xl aspect-[16/10] bg-card rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-card-border/50">
        {/* Left Side: Image */}
        <div 
          className="w-full md:w-1/2 bg-cover bg-center h-48 md:h-auto"
          style={{ backgroundImage: `url(${stockImage})` }}
        />

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col text-card-foreground relative">
          <div className="flex-1 flex flex-col justify-center">
            <FormStep isActive={step === 1} direction={direction}>
              <div className="space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">What's your name and number?</h1>
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  />
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 2} direction={direction}>
              <div className="space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">How many hours?</h1>
                <div className="grid grid-cols-1 gap-4">
                  {Object.keys(settings?.hourlyRates || {}).map((h) => (
                    <button
                      key={h}
                      onClick={() => setFormData({ ...formData, hours: h })}
                      className={`w-full py-4 rounded-2xl text-xl font-medium border transition-all ${
                        formData.hours === h 
                          ? "bg-white text-card border-white shadow-lg" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {h} Hour{h !== "1" ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </FormStep>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center gap-4">
            {step > 1 && (
              <button onClick={handleBack} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={step === totalSteps ? handleSubmit : handleNext}
              className="flex-1 bg-white text-card py-4 rounded-full text-xl font-bold hover:bg-opacity-90 transition-all active:scale-[0.98]"
            >
              {step === totalSteps ? "OK" : "Next"}
            </button>
          </div>

          {/* Background Total Label */}
          <div className="absolute bottom-8 right-8 opacity-10 text-6xl md:text-8xl font-bold pointer-events-none select-none">
            Total: ${calculatedCost}
          </div>
        </div>
      </div>

      {/* Logo at Bottom */}
      <div className="mt-12 opacity-80 max-w-[200px]">
        <img src={logoImg} alt="grind theory logo" className="w-full h-auto" />
      </div>
    </div>
  );
}
