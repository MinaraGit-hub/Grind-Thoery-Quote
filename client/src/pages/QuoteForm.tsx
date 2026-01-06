import { useState, useMemo } from "react";
import { useSettings, useCreateSubmission } from "@/hooks/use-form-data";
import { CircularProgress } from "@/components/CircularProgress";
import { FormStep } from "@/components/FormStep";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Loader2, Check, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Untitled-1_1767674078681.png";
import stockImage from "@assets/stock_images/modern_aesthetic_cof_0cee769b.jpg";

import Untitled_1 from "@assets/Untitled-1.png";

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    eventType: "",
    hours: "",
    customHours: "",
    hasAddon: false,
    signatureDrinks: {
      "Tiramisu iced latte": 0,
      "Banana cheesecake cold foam latte": 0,
      "Biscoff cold foam latte": 0,
      "Iced dirty matcha": 0,
      "Cold brew / cold brew concentrate": 0
    } as Record<string, number>,
    matchaUpgrade: {
      "Standard Matcha (hot + iced)": 0,
      "Matcha specialty menu": 0
    } as Record<string, number>,
    cannedBeverages: "none",
    bakedGoods: { count: 0, useBulk: false },
    alternativeMilk: 0,
    branding: {
      cupCustomization: "none",
      stickerCups: 1000,
      stickerPrice: 0,
      sleeveCups: 1000,
      sleevePrice: 0,
      cartBranding: "none",
      cartPrice: 0
    },
    guestCount: "1–30",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const createSubmission = useCreateSubmission();
  const { toast } = useToast();

  const totalSteps = 9; 
  const displaySteps = 9; 
  const [wantEmail, setWantEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const cannedOptions = [
    { label: "None", value: "none", price: 0 },
    { label: "10 cans", value: "10", price: 90 },
    { label: "20 cans", value: "20", price: 170 },
    { label: "50 cans", value: "50", price: 400 },
    { label: "100 cans", value: "100", price: 750 },
    { label: "200 cans", value: "200", price: 1300 },
  ];

  const calculatedCost = useMemo(() => {
    if (!settings) return 0;
    
    let baseCost = 0;
    const hoursNum = formData.hours === "custom" ? parseInt(formData.customHours) : parseInt(formData.hours);
    
    if (formData.hours === "custom") {
      const h = parseInt(formData.customHours);
      if (isNaN(h) || h < 6) baseCost = 0;
      else baseCost = 800 + (h - 5) * 200;
    } else if (formData.hours) {
      const hourlyOptions: Record<string, number> = {
        "2": 200,
        "3": 400,
        "4": 600,
        "5": 800
      };
      baseCost = hourlyOptions[formData.hours] || 0;
    }
    
    // Apply event surplus
    const surplusPercent = settings.eventSurplus?.[formData.eventType] ?? 0;
    let finalCost = Math.round(baseCost * (1 + surplusPercent / 100));
    
    if (formData.hasAddon) {
      finalCost += 650;
    }

    // Apply guest count modifier
    const guestModifiers: Record<string, number> = {
      "1–30": 0,
      "30–60": 10,
      "60–100": 25,
      "100–150": 40,
      "150–250": 65,
      "250+": 75
    };
    const guestModifier = guestModifiers[formData.guestCount] || 0;
    finalCost = Math.round(finalCost * (1 + guestModifier / 100));

    // Add signature drinks cost: $10 per additional drink
    const totalSigDrinks = Object.values(formData.signatureDrinks).reduce((a, b) => a + b, 0);
    finalCost += totalSigDrinks * 10;

    // Add matcha upgrade cost
    const standardMatcha = formData.matchaUpgrade["Standard Matcha (hot + iced)"] || 0;
    const specialtyMatcha = formData.matchaUpgrade["Matcha specialty menu"] || 0;
    finalCost += standardMatcha * 7;
    finalCost += specialtyMatcha * 11;

    // Add canned beverages cost
    const canned = cannedOptions.find(opt => opt.value === formData.cannedBeverages);
    if (canned) finalCost += canned.price;

    // Add Baked Goods Add-ons
    if (formData.bakedGoods.useBulk) {
      finalCost += 180;
    } else {
      finalCost += formData.bakedGoods.count * 7;
    }

    // Add Alternative milk pricing
    if (!isNaN(hoursNum) && hoursNum >= 2 && formData.alternativeMilk > 0) {
      let altMilkTierCost = 0;
      if (hoursNum <= 2) altMilkTierCost = 200;
      else if (hoursNum <= 4) altMilkTierCost = 400;
      else if (hoursNum === 5) altMilkTierCost = 600;
      else if (hoursNum === 6) altMilkTierCost = 800;
      else altMilkTierCost = 800 + (hoursNum - 6) * 200;
      
      finalCost += formData.alternativeMilk * altMilkTierCost;
    }

    // Add Branding Upgrades cost
    if (formData.branding.cupCustomization === "stickers") {
      const extraCups = Math.max(0, formData.branding.stickerCups - 1000);
      const extraTiers = Math.ceil(extraCups / 200);
      finalCost += 120 + 250 + extraTiers * 50;
    } else if (formData.branding.cupCustomization === "sleeves") {
      const extraCups = Math.max(0, formData.branding.sleeveCups - 1000);
      const extraTiers = Math.ceil(extraCups / 200);
      finalCost += 250 + 400 + extraTiers * 80;
    }

    if (formData.branding.cartBranding === "vinyl") finalCost += 150;
    else if (formData.branding.cartBranding === "magnetic") finalCost += 280;
    else if (formData.branding.cartBranding === "acrylic") finalCost += 600;
    
    return finalCost;
  }, [settings, formData, cannedOptions]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.fullName) {
        newErrors.fullName = "Full Name is required";
      }
      
      const phoneRegex = /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
      if (!formData.mobileNumber) {
        newErrors.mobileNumber = "Mobile Number is required";
      } else if (!phoneRegex.test(formData.mobileNumber.replace(/\s/g, ""))) {
        newErrors.mobileNumber = "Please enter a valid mobile number (e.g. 0412 345 678)";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    
    if (step === 3) {
      if (!formData.hours) {
        toast({
          title: "Selection required",
          description: "Please select the number of hours.",
          variant: "destructive",
        });
        return;
      }
      if (formData.hours === "custom" && (!formData.customHours || parseInt(formData.customHours) < 6)) {
        toast({
          title: "Invalid hours",
          description: "Please enter a minimum of 6 hours for custom duration.",
          variant: "destructive",
        });
        return;
      }
    }
    if (step === 4) {
      if (!formData.eventType) {
        toast({
          title: "Selection required",
          description: "Please select an event type.",
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

  const updateDrinkQuantity = (type: 'signature' | 'matcha', drink: string, delta: number) => {
    setFormData(prev => {
      const field = type === 'signature' ? 'signatureDrinks' : 'matchaUpgrade';
      return {
        ...prev,
        [field]: {
          ...prev[field],
          [drink]: Math.max(0, (prev[field][drink] || 0) + delta)
        }
      };
    });
  };

  const handleSubmit = async () => {
    try {
      const finalHours = formData.hours === "custom" ? parseInt(formData.customHours) : parseInt(formData.hours);
      await createSubmission.mutateAsync({
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        eventType: formData.eventType,
        hours: finalHours,
        hasAddon: formData.hasAddon,
        guestCount: formData.guestCount,
        signatureDrinks: formData.signatureDrinks,
        matchaUpgrade: formData.matchaUpgrade,
        cannedBeverages: formData.cannedBeverages,
        bakedGoods: formData.bakedGoods,
        alternativeMilk: formData.alternativeMilk,
        branding: {
          ...formData.branding,
          stickerPrice: formData.branding.cupCustomization === "stickers" ? 120 + 250 + Math.ceil(Math.max(0, formData.branding.stickerCups - 1000) / 200) * 50 : 0,
          sleevePrice: formData.branding.cupCustomization === "sleeves" ? 250 + 400 + Math.ceil(Math.max(0, formData.branding.sleeveCups - 1000) / 200) * 80 : 0,
          cartPrice: formData.branding.cartBranding === "vinyl" ? 150 : formData.branding.cartBranding === "magnetic" ? 280 : formData.branding.cartBranding === "acrylic" ? 600 : 0
        },
        calculatedCost: calculatedCost,
        wantEmail: wantEmail,
        emailAddress: wantEmail ? emailAddress : undefined,
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
            Thank you, {formData.fullName}. Quote received for your {formData.eventType}. We will be in touch with you shortly.
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
    <div className="min-h-screen bg-background flex flex-col items-center py-4 md:py-12 px-4 md:px-6 overflow-x-hidden">
      {/* Mobile Logo */}
      <div className="md:hidden w-full mb-4 px-2">
        <img src={Untitled_1} alt="Grind Theory" className="h-10 mx-auto" />
      </div>
      {/* Progress Bar - Desktop Only */}
      <div className="hidden md:block w-full max-w-5xl mb-8">
        <CircularProgress currentStep={step} totalSteps={displaySteps} className="scale-100" />
      </div>
      {/* Main Container */}
      <div className="w-full flex-1 md:flex-none max-w-5xl md:min-h-[600px] bg-card rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-card-border/30 md:border-card-border/50">
        
        {/* Left Side: Image */}
        <div 
          className="w-full md:w-5/12 bg-cover bg-center h-32 md:h-auto shrink-0 rounded-t-2xl md:rounded-none"
          style={{ backgroundImage: `url(${stockImage})` }}
        />

        {/* Right Side: Form Content */}
        <div className="w-full md:w-7/12 px-5 py-4 md:p-10 flex flex-col text-card-foreground relative flex-1">
          
          {/* Mobile Progress Indicator */}
          <div className="md:hidden flex justify-between items-center mb-4 gap-4">
            <span className="text-xs opacity-60 font-medium uppercase tracking-wider whitespace-nowrap">Step {step} of {displaySteps}</span>
            <div className="h-1 flex-1 max-w-32 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300" 
                style={{ width: `${(step / displaySteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-0">
            <FormStep isActive={step === 1} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">Personal Information</h1>
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className={`w-full bg-white/10 border ${errors.fullName ? 'border-red-500' : 'border-white/20'} rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30`}
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                      }}
                    />
                    {errors.fullName && <p className="text-red-400 text-sm ml-2">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      className={`w-full bg-white/10 border ${errors.mobileNumber ? 'border-red-500' : 'border-white/20'} rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30`}
                      value={formData.mobileNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, mobileNumber: e.target.value });
                        if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: "" }));
                      }}
                    />
                    {errors.mobileNumber && <p className="text-red-400 text-sm ml-2">{errors.mobileNumber}</p>}
                  </div>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 2} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-bold">Event Package:</h1>
                  <p className="text-lg md:text-xl opacity-60 font-medium">Base Service Rate</p>
                </div>
                <div className="space-y-4 text-lg opacity-90">
                  <p className="font-semibold text-white">Base package includes:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Espresso machine</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Grinder</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Water system</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Cups, lids, napkins</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Premium beans</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> 2 staff (minimum)</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Standard menu</li>
                    <li className="flex items-center gap-2 text-base md:text-lg"><div className="w-1.5 h-1.5 rounded-full bg-white/60" /> Setup + Packdown</li>
                  </ul>
                </div>

                <div className="mt-8 space-y-6">
                  <label className="flex items-center gap-3 p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none">
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
                      <span className="text-lg font-medium">Select Base Package</span>
                      <span className="text-sm opacity-60">+$650.00 Flat Fee</span>
                    </div>
                  </label>

                  <div className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Guest Count:</p>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                      >
                        <option value="1–30" className="bg-[#6B5E51]">1–30 (+0%)</option>
                        <option value="30–60" className="bg-[#6B5E51]">30–60 (+10%)</option>
                        <option value="60–100" className="bg-[#6B5E51]">60–100 (+25%)</option>
                        <option value="100–150" className="bg-[#6B5E51]">100–150 (+40%)</option>
                        <option value="150–250" className="bg-[#6B5E51]">150–250 (+65%)</option>
                        <option value="250+" className="bg-[#6B5E51]">250+ (+75%)</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 3} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">How many hours?</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {[
                    { val: "2", label: "2 Hours (+$200)" },
                    { val: "3", label: "3 Hours (+$400)" },
                    { val: "4", label: "4 Hours (+$600)" },
                    { val: "5", label: "5 Hours (+$800)" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setFormData({ ...formData, hours: opt.val })}
                      className={`w-full py-4 rounded-xl md:rounded-2xl text-xl font-medium border transition-all ${
                        formData.hours === opt.val 
                          ? "bg-white text-[#6B5E51] border-white shadow-lg" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, hours: "custom" })}
                    className={`w-full py-4 rounded-xl md:rounded-2xl text-xl font-medium border transition-all ${
                      formData.hours === "custom" 
                        ? "bg-white text-[#6B5E51] border-white shadow-lg" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Custom (6+ Hours)
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
                      min="6"
                      placeholder="Enter number of hours"
                      className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                      value={formData.customHours}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, customHours: val }));
                      }}
                    />
                    <p className="text-sm opacity-60 mt-2 ml-2">Charged at $800 + $200 per extra hour</p>
                  </motion.div>
                )}
              </div>
            </FormStep>

            <FormStep isActive={step === 4} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">What type of event is it?</h1>
                <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(settings?.eventSurplus || {}).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, eventType: type })}
                      className={`w-full py-3.5 rounded-xl md:rounded-2xl text-lg font-medium border transition-all text-center ${
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

            <FormStep isActive={step === 5} direction={direction}>
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold">Signature Drinks</h1>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(formData.signatureDrinks).map((drink) => {
                    if (drink === "Iced dirty matcha" && formData.eventType !== "Matcha") return null; 
                    
                    return (
                      <div key={drink} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                        <span className="flex-1 mr-4 text-[14px]">{drink}</span>
                        <div className="flex items-center gap-2 md:gap-4 bg-white/10 rounded-lg md:rounded-xl px-1.5 md:px-2 py-1">
                          <button 
                            onClick={() => updateDrinkQuantity('signature', drink, -1)}
                            className="p-0.5 md:p-1 hover:bg-white/20 rounded-md md:rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="bg-transparent text-lg md:text-xl font-bold w-8 md:w-12 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={formData.signatureDrinks[drink]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setFormData(prev => ({
                                ...prev,
                                signatureDrinks: { ...prev.signatureDrinks, [drink]: Math.max(0, val) }
                              }));
                            }}
                          />
                          <button 
                            onClick={() => updateDrinkQuantity('signature', drink, 1)}
                            className="p-0.5 md:p-1 hover:bg-white/20 rounded-md md:rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-sm opacity-60 text-center mt-4">Each signature drink adds $10.00 to the quote</p>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 6} direction={direction}>
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold">Custom Upgrade</h1>
                <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  <section className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Matcha Upgrade:</p>
                    {Object.keys(formData.matchaUpgrade).map((drink) => (
                      <div key={drink} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-sm md:text-lg flex-1 mr-3 md:mr-4">{drink}</span>
                        <div className="flex items-center gap-2 md:gap-4 bg-white/10 rounded-lg md:rounded-xl px-1.5 md:px-2 py-1">
                          <button 
                            onClick={() => updateDrinkQuantity('matcha', drink, -1)}
                            className="p-0.5 md:p-1 hover:bg-white/20 rounded-md md:rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="bg-transparent text-lg md:text-xl font-bold w-8 md:w-12 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={formData.matchaUpgrade[drink]}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setFormData(prev => ({
                                ...prev,
                                matchaUpgrade: { ...prev.matchaUpgrade, [drink]: Math.max(0, val) }
                              }));
                            }}
                          />
                          <button 
                            onClick={() => updateDrinkQuantity('matcha', drink, 1)}
                            className="p-0.5 md:p-1 hover:bg-white/20 rounded-md md:rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs opacity-50 text-right">Standard: +$7.00 | Specialty: +$11.00</p>
                  </section>

                  <section className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Machine Canned Beverages Upgrade:</p>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={formData.cannedBeverages}
                        onChange={(e) => setFormData({ ...formData, cannedBeverages: e.target.value })}
                      >
                        {cannedOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-[#6B5E51]">
                            {opt.label} {opt.price > 0 ? `(+$${opt.price})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </section>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 7} direction={direction}>
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold">Baked Goods Add-ons</h1>
                <div className="space-y-6 max-h-[400px] md:max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  <section className="space-y-4">
                    <div className="p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-medium">Individual Pastries</span>
                        <span className="text-sm opacity-60">$7.00 per pastry</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 md:gap-6 bg-white/10 rounded-lg md:rounded-2xl py-2 md:py-3 px-4 md:px-6">
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, bakedGoods: { ...prev.bakedGoods, count: Math.max(0, prev.bakedGoods.count - 1), useBulk: false } }))}
                          className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                        >
                          <Minus className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                          <input
                            type="number"
                            min="0"
                            className="bg-transparent text-lg md:text-xl font-bold w-10 md:w-12 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={formData.bakedGoods.useBulk ? 0 : formData.bakedGoods.count}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setFormData(prev => ({
                                ...prev,
                                bakedGoods: { ...prev.bakedGoods, count: Math.max(0, val), useBulk: false }
                              }));
                            }}
                          />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, bakedGoods: { ...prev.bakedGoods, count: prev.bakedGoods.count + 1, useBulk: false } }))}
                          className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                        >
                          <Plus className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase tracking-widest">
                        <span className="bg-[#6B5E51] px-4 opacity-40 italic">or choose bulk</span>
                      </div>
                    </div>

                    <label className="flex items-center gap-4 p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer appearance-none w-7 h-7 border-2 border-white/30 rounded-lg checked:bg-white checked:border-white transition-all"
                          checked={formData.bakedGoods.useBulk}
                          onChange={(e) => setFormData({ ...formData, bakedGoods: { count: 0, useBulk: e.target.checked } })}
                        />
                        <Check className="absolute w-5 h-5 text-[#6B5E51] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xl font-bold">40 Pastries Bulk Pack</span>
                        <span className="text-sm opacity-60">$180.00 Flat Fee</span>
                      </div>
                    </label>
                  </section>

                  <section className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold">Alternative Milk</h2>
                      <p className="text-sm opacity-60">Almond milks, Oat milk, Lactose-free milk</p>
                    </div>
                    <div className="flex items-center justify-between p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-base md:text-lg font-medium">Cost /2hrs</span>
                      <div className="flex items-center gap-4 md:gap-6 bg-white/10 rounded-lg md:rounded-2xl py-2 md:py-3 px-4 md:px-6">
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, alternativeMilk: Math.max(0, prev.alternativeMilk - 1) }))}
                          className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                        >
                          <Minus className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          className="bg-transparent text-lg md:text-xl font-bold w-10 md:w-12 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={formData.alternativeMilk}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              alternativeMilk: Math.max(0, val)
                            }));
                          }}
                        />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, alternativeMilk: prev.alternativeMilk + 1 }))}
                          className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                        >
                          <Plus className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs opacity-50 text-right">Pricing based on event duration (+$200 per tier)</p>
                  </section>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 8} direction={direction}>
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold">Branding Upgrades</h1>
                <div className="space-y-6 max-h-[400px] md:max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  <section className="space-y-4">
                    <p className="text-lg font-semibold opacity-70">Cup Customisation</p>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={formData.branding.cupCustomization}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          branding: { ...formData.branding, cupCustomization: e.target.value } 
                        })}
                      >
                        <option value="none" className="bg-[#6B5E51]">None</option>
                        <option value="stickers" className="bg-[#6B5E51]">Custom stickers on cups $120 flat</option>
                        <option value="sleeves" className="bg-[#6B5E51]">Custom cup sleeves $250 flat</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>

                    {formData.branding.cupCustomization !== "none" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 space-y-3 md:space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base md:text-lg font-medium">Number of Cups</span>
                          <span className="text-xs md:text-sm opacity-60">Base 1000 cups</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 md:gap-6 bg-white/10 rounded-lg md:rounded-2xl py-2 md:py-3 px-4 md:px-6">
                          <button 
                            onClick={() => {
                              const field = formData.branding.cupCustomization === "stickers" ? "stickerCups" : "sleeveCups";
                              setFormData(prev => ({
                                ...prev,
                                branding: { 
                                  ...prev.branding, 
                                  [field]: Math.max(1000, prev.branding[field as 'stickerCups' | 'sleeveCups'] - 200) 
                                }
                              }));
                            }}
                            className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                          >
                            <Minus className="w-5 h-5 md:w-6 md:h-6" />
                          </button>
                          <input
                            type="number"
                            min="1000"
                            step="200"
                            className="bg-transparent text-2xl md:text-3xl font-bold w-20 md:w-24 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={formData.branding.cupCustomization === "stickers" ? formData.branding.stickerCups : formData.branding.sleeveCups}
                            onChange={(e) => {
                              const val = Math.max(1000, parseInt(e.target.value) || 1000);
                              const field = formData.branding.cupCustomization === "stickers" ? "stickerCups" : "sleeveCups";
                              setFormData(prev => ({
                                ...prev,
                                branding: { ...prev.branding, [field]: val }
                              }));
                            }}
                          />
                          <button 
                            onClick={() => {
                              const field = formData.branding.cupCustomization === "stickers" ? "stickerCups" : "sleeveCups";
                              setFormData(prev => ({
                                ...prev,
                                branding: { 
                                  ...prev.branding, 
                                  [field]: prev.branding[field as 'stickerCups' | 'sleeveCups'] + 200 
                                }
                              }));
                            }}
                            className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                          >
                            <Plus className="w-5 h-5 md:w-6 md:h-6" />
                          </button>
                        </div>
                        <p className="text-xs opacity-50 text-center">
                          {formData.branding.cupCustomization === "stickers" 
                            ? "1000 cups adds $250, then $50 per 200 extra" 
                            : "1000 cups adds $400, then $80 per 200 extra"}
                        </p>
                      </motion.div>
                    )}
                  </section>

                  <section className="space-y-4 pt-4 border-t border-white/10">
                    <p className="text-lg font-semibold opacity-70">Cart Branding</p>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={formData.branding.cartBranding}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          branding: { ...formData.branding, cartBranding: e.target.value } 
                        })}
                      >
                        <option value="none" className="bg-[#6B5E51]">None</option>
                        <option value="vinyl" className="bg-[#6B5E51]">Temporary vinyl sticker $150</option>
                        <option value="magnetic" className="bg-[#6B5E51]">Magnetic panels $280</option>
                        <option value="acrylic" className="bg-[#6B5E51]">Custom acrylic $600</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </section>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 9} direction={direction}>
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold text-center">Ready to submit?</h1>
                
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-lg font-semibold opacity-70">Quote Estimate Summary:</p>
                  <ul className="space-y-2 text-base">
                    <li className="flex justify-between"><span className="opacity-70">Event package:</span> <span>{formData.hasAddon ? "Base Package (+$650)" : "Not selected"}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Guest count:</span> <span>{formData.guestCount}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Number of hours:</span> <span>{formData.hours === "custom" ? `${formData.customHours} hours` : `${formData.hours} hours`}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Event type:</span> <span>{formData.eventType || "Not selected"}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Signature drinks:</span> <span>{Object.values(formData.signatureDrinks).reduce((a, b) => a + b, 0)} drinks</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Custom upgrades:</span> <span>{(formData.matchaUpgrade["Standard Matcha (hot + iced)"] || 0) + (formData.matchaUpgrade["Matcha specialty menu"] || 0)} matcha, {formData.cannedBeverages !== "none" ? `${formData.cannedBeverages} cans` : "No cans"}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Baked Goods Add-ons:</span> <span>{formData.bakedGoods.useBulk ? "40 Bulk Pack" : `${formData.bakedGoods.count} pastries`}{formData.alternativeMilk > 0 ? `, Alt milk x${formData.alternativeMilk}` : ""}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Branding Upgrades:</span> <span>{formData.branding.cupCustomization !== "none" ? (formData.branding.cupCustomization === "stickers" ? "Stickers" : "Sleeves") : "None"}{formData.branding.cartBranding !== "none" ? `, ${formData.branding.cartBranding}` : ""}</span></li>
                    <li className="flex justify-between text-sm opacity-60"><span>Miscellaneous costs:</span> <span className="text-right">Varies (travel, power, accessibility, extra staff)</span></li>
                  </ul>

                  <div className="p-4 rounded-xl md:rounded-2xl bg-white/10 border border-white/20 text-center mt-4">
                    <p className="text-sm uppercase tracking-widest opacity-60 mb-1">Estimated Cost</p>
                    <p className="text-2xl md:text-3xl font-bold">${calculatedCost} – ${calculatedCost + 400}</p>
                  </div>

                  <label className="flex items-center gap-3 p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none mt-4">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="peer appearance-none w-6 h-6 border-2 border-white/30 rounded-md checked:bg-white checked:border-white transition-all"
                        checked={wantEmail}
                        onChange={(e) => setWantEmail(e.target.checked)}
                      />
                      <Check className="absolute w-4 h-4 text-[#6B5E51] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-lg font-medium">I would like my quote emailed</span>
                  </label>

                  {wantEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2"
                    >
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </FormStep>
          </div>

          {/* Bottom Control Bar */}
          <div className="mt-auto pt-6 md:pt-8 space-y-4 md:space-y-6">
            {step > 1 && (
              <div className="flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={calculatedCost}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xl md:text-2xl font-bold text-white/90"
                  >
                    Total: ${calculatedCost}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-3 md:gap-4 pb-1 md:pb-0">
              {step > 1 && (
                <button 
                  onClick={handleBack} 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              )}
              <button
                onClick={step === totalSteps ? handleSubmit : handleNext}
                disabled={(step === 2 && (!formData.hasAddon || !formData.guestCount)) || (step === 3 && !formData.hours) || (step === totalSteps && createSubmission.isPending)}
                className={`flex-1 bg-white text-[#6B5E51] h-12 md:h-14 rounded-full text-lg md:text-xl font-bold hover:bg-opacity-90 transition-all active:scale-[0.98] ${
                  ((step === 2 && (!formData.hasAddon || !formData.guestCount)) || (step === 3 && !formData.hours)) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {step === totalSteps ? "OK" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Logo at Bottom - Desktop Only */}
      <div className="hidden md:block mt-12 opacity-80 max-w-[200px]">
        <img src={logoImg} alt="grind theory logo" className="w-full h-auto" />
      </div>
    </div>
  );
}
