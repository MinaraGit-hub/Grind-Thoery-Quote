import { useState, useMemo } from "react";
import { useSettings, useCreateSubmission } from "@/hooks/use-form-data";
import { CircularProgress } from "@/components/CircularProgress";
import { FormStep } from "@/components/FormStep";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Untitled-1_1767674078681.png";
import stockImage from "@assets/stock_images/coffee_latte_art_top_1750a1c1.jpg";

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    eventType: "Private Function",
    hours: "",
    customHours: "",
    hasAddon: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const createSubmission = useCreateSubmission();
  const { toast } = useToast();

  const totalSteps = 4; 
  const displaySteps = 5; 

  const calculatedCost = useMemo(() => {
    if (!settings || !formData.hours) return 0;
    
    let baseCost = 0;
    if (formData.hours === "custom") {
      const h = parseInt(formData.customHours);
      if (isNaN(h) || h < 5) return 0;
      // 5 hours is $1450, then $200 for each hour above 5
      baseCost = 1450 + (h - 5) * 200;
    } else {
      // Base cost from hours
      const specificRate = settings.hourlyRates[formData.hours as keyof typeof settings.hourlyRates];
      baseCost = specificRate || (settings.baseRate * (parseInt(formData.hours) || 0));
    }
    
    // Apply event surplus
    const surplusPercent = settings.eventSurplus?.[formData.eventType] ?? 0;
    let finalCost = Math.round(baseCost * (1 + surplusPercent / 100));
    
    // Add $650 if add-on is selected
    if (formData.hasAddon) {
      finalCost += 650;
    }
    
    return finalCost;
  }, [settings, formData.hours, formData.customHours, formData.eventType, formData.hasAddon]);

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
    if (step === 3) {
      if (!formData.hours) {
        toast({
          title: "Selection required",
          description: "Please select the number of hours.",
          variant: "destructive",
        });
        return;
      }
      if (formData.hours === "custom" && (!formData.customHours || parseInt(formData.customHours) < 1)) {
        toast({
          title: "Invalid hours",
          description: "Please enter a valid number of hours.",
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
    if (!formData.eventType) {
      toast({
        title: "Selection required",
        description: "Please select an event type.",
        variant: "destructive",
      });
      return;
    }

    try {
      const finalHours = formData.hours === "custom" ? parseInt(formData.customHours) : parseInt(formData.hours);
      await createSubmission.mutateAsync({
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        eventType: formData.eventType,
        hours: finalHours,
        hasAddon: formData.hasAddon,
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
            Thank you, {formData.fullName}. Quote received for your {formData.eventType}.
          </p>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-sm uppercase tracking-widest opacity-60 mb-1">Total Quote</p>
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
          className="w-full md:w-1/2 bg-cover bg-[center_top] h-48 md:h-auto"
          style={{ backgroundImage: `url(${stockImage})` }}
        />

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col text-card-foreground relative">
          <div className="flex-1 flex flex-col justify-center">
            <FormStep isActive={step === 1} direction={direction}>
              <div className="space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">Personal Information</h1>
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
                <h1 className="text-3xl md:text-4xl font-bold">Event Duration (Base Service Rate)</h1>
                <div className="space-y-4 text-lg opacity-90">
                  <p className="font-semibold text-white">Base package includes:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Espresso machine</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Grinder</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Water system</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Cups, lids, napkins</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Premium beans</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> 2 staff (minimum)</li>
                    <li className="flex items-center gap-2" colSpan={2}><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Standard menu</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Setup + Packdown</li>
                  </ul>
                  <p className="text-sm opacity-60 italic mt-4">Select your duration on the next screen to see pricing.</p>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 3} direction={direction}>
              <div className="space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">How many hours?</h1>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(settings?.hourlyRates || {}).map((h) => (
                    <button
                      key={h}
                      onClick={() => setFormData({ ...formData, hours: h })}
                      className={`w-full py-4 rounded-2xl text-xl font-medium border transition-all ${
                        formData.hours === h 
                          ? "bg-white text-[#6B5E51] border-white shadow-lg" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {h} Hour{h !== "1" ? "s" : ""}
                    </button>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, hours: "custom" })}
                    className={`w-full py-4 rounded-2xl text-xl font-medium border transition-all ${
                      formData.hours === "custom" 
                        ? "bg-white text-[#6B5E51] border-white shadow-lg" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Custom (5+ Hours)
                  </button>
                </div>
                {formData.hours === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4"
                  >
                    <input
                      type="number"
                      min="5"
                      placeholder="Enter number of hours"
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                      value={formData.customHours}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, customHours: val }));
                      }}
                    />
                    <p className="text-sm opacity-60 mt-2 ml-2">Charged at $1,450 + $200 per extra hour</p>
                  </motion.div>
                )}

                <div className="mt-8">
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="peer appearance-none w-6 h-6 border-2 border-white/30 rounded-md checked:bg-white checked:border-white transition-all"
                        checked={formData.hasAddon}
                        onChange={(e) => setFormData({ ...formData, hasAddon: e.target.checked })}
                      />
                      <Check className="absolute w-4 h-4 text-[#6B5E51] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-medium">Add Premium Package Upgrade</span>
                      <span className="text-sm opacity-60">+$650.00 Flat Fee</span>
                    </div>
                  </label>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 3} direction={direction}>
              <div className="space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">What type of event is it?</h1>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(settings?.eventSurplus || {}).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, eventType: type })}
                      className={`w-full py-3 rounded-2xl text-lg font-medium border transition-all ${
                        formData.eventType === type 
                          ? "bg-white text-[#6B5E51] border-white shadow-lg" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </FormStep>
          </div>

          {/* Dynamic Total Display above OK button */}
          <div className="mt-4 mb-2 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={calculatedCost}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-2xl font-bold text-white/90"
              >
                Total: ${calculatedCost}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center gap-4">
            {step > 1 && (
              <button 
                onClick={handleBack} 
                className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={step === totalSteps ? handleSubmit : handleNext}
              className="flex-1 bg-white text-[#6B5E51] h-14 rounded-full text-xl font-bold hover:bg-opacity-90 transition-all active:scale-[0.98]"
            >
              {step === totalSteps ? "OK" : "Next"}
            </button>
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
