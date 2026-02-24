import { useState, useMemo, useEffect } from "react";
import { useSettings, useCreateSubmission } from "@/hooks/use-form-data";
import { CircularProgress } from "@/components/CircularProgress";
import { FormStep } from "@/components/FormStep";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Loader2, Check, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Untitled-1_1767674078681.png";
import grindTheoryLogo from "@assets/Untitled-1_1771895621895.png";
import stockImage from "@assets/stock_images/modern_aesthetic_cof_0cee769b.jpg";
import Untitled_1 from "@assets/Untitled-1.png";
import type { PricingConfig } from "@shared/schema";
import { DEFAULT_PRICING_CONFIG } from "@shared/schema";

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
    signatureDrinks: {} as Record<string, number>,
    matchaUpgrade: {} as Record<string, number>,
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
    guestCount: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const createSubmission = useCreateSubmission();
  const { toast } = useToast();

  const pc: PricingConfig = settings?.pricingConfig || DEFAULT_PRICING_CONFIG;

  useEffect(() => {
    if (settings?.pricingConfig) {
      const cfg = settings.pricingConfig;
      const sigDrinks: Record<string, number> = {};
      cfg.signatureDrinksList.forEach(d => { sigDrinks[d] = 0; });

      const matchaUpgrade: Record<string, number> = {};
      Object.keys(cfg.matchaOptions).forEach(m => { matchaUpgrade[m] = 0; });

      const guestKeys = Object.keys(cfg.guestModifiers);

      setFormData(prev => ({
        ...prev,
        signatureDrinks: sigDrinks,
        matchaUpgrade: matchaUpgrade,
        guestCount: prev.guestCount || (guestKeys.length > 0 ? guestKeys[0] : ""),
      }));
    }
  }, [settings]);

  const totalSteps = 9;
  const displaySteps = 9;
  const [wantEmail, setWantEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const calculatedCost = useMemo(() => {
    if (!settings) return 0;

    let baseCost = 0;
    const hoursNum = formData.hours === "custom" ? parseInt(formData.customHours) : parseInt(formData.hours);

    if (formData.hours === "custom") {
      const h = parseInt(formData.customHours);
      if (isNaN(h) || h < pc.customHoursMin) baseCost = 0;
      else baseCost = pc.customHoursBase + (h - (pc.customHoursMin - 1)) * pc.customHoursExtra;
    } else if (formData.hours) {
      baseCost = pc.hourlyPricing[formData.hours] || 0;
    }

    const surplusPercent = settings.eventSurplus?.[formData.eventType] ?? 0;
    let finalCost = Math.round(baseCost * (1 + surplusPercent / 100));

    if (formData.hasAddon) {
      finalCost += pc.basePackagePrice;
    }

    const guestModifier = pc.guestModifiers[formData.guestCount] || 0;
    finalCost = Math.round(finalCost * (1 + guestModifier / 100));

    const totalSigDrinks = Object.values(formData.signatureDrinks).reduce((a, b) => a + b, 0);
    finalCost += totalSigDrinks * pc.signatureDrinkPrice;

    Object.entries(formData.matchaUpgrade).forEach(([name, qty]) => {
      const unitPrice = pc.matchaOptions[name] || 0;
      finalCost += qty * unitPrice;
    });

    const canned = pc.cannedOptions.find(opt => opt.value === formData.cannedBeverages);
    if (canned) finalCost += canned.price;

    if (formData.bakedGoods.useBulk) {
      finalCost += pc.bakedGoodsBulkPrice;
    } else {
      finalCost += formData.bakedGoods.count * pc.bakedGoodsPerItem;
    }

    if (!isNaN(hoursNum) && hoursNum >= pc.altMilkMinHours && formData.alternativeMilk > 0) {
      let altMilkTierCost = 0;
      const tierKeys = Object.keys(pc.altMilkTiers).map(Number).sort((a, b) => a - b);
      const matchedTier = tierKeys.filter(k => hoursNum >= k).pop();
      if (matchedTier !== undefined) {
        altMilkTierCost = pc.altMilkTiers[String(matchedTier)];
        if (hoursNum > Math.max(...tierKeys)) {
          altMilkTierCost += (hoursNum - Math.max(...tierKeys)) * pc.altMilkExtraPerHour;
        }
      } else {
        altMilkTierCost = pc.altMilkExtraPerHour;
      }
      finalCost += formData.alternativeMilk * altMilkTierCost;
    }

    if (formData.branding.cupCustomization === "stickers") {
      const extraCups = Math.max(0, formData.branding.stickerCups - pc.stickerBaseCups);
      const extraTiers = Math.ceil(extraCups / pc.stickerExtraCupStep);
      finalCost += pc.stickerDesignFee + pc.stickerBasePrint + extraTiers * pc.stickerExtraPerStep;
    } else if (formData.branding.cupCustomization === "sleeves") {
      const extraCups = Math.max(0, formData.branding.sleeveCups - pc.sleeveBaseCups);
      const extraTiers = Math.ceil(extraCups / pc.sleeveExtraCupStep);
      finalCost += pc.sleeveDesignFee + pc.sleeveBasePrint + extraTiers * pc.sleeveExtraPerStep;
    }

    const cartPrice = pc.cartBrandingOptions[formData.branding.cartBranding] || 0;
    finalCost += cartPrice;

    return finalCost;
  }, [settings, formData, pc]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.fullName) newErrors.fullName = "Full Name is required";
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
    if (step === 2) {
      if (!formData.hasAddon) {
        toast({ title: "Selection required", description: "Please select the base package to continue.", variant: "destructive" });
        return;
      }
    }
    if (step === 3) {
      if (!formData.hours) {
        toast({ title: "Selection required", description: "Please select the number of hours.", variant: "destructive" });
        return;
      }
      if (formData.hours === "custom" && (!formData.customHours || parseInt(formData.customHours) < pc.customHoursMin)) {
        toast({ title: "Invalid hours", description: `Please enter a minimum of ${pc.customHoursMin} hours for custom duration.`, variant: "destructive" });
        return;
      }
    }
    if (step === 4) {
      if (!formData.eventType) {
        toast({ title: "Selection required", description: "Please select an event type.", variant: "destructive" });
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
          stickerPrice: formData.branding.cupCustomization === "stickers"
            ? pc.stickerDesignFee + pc.stickerBasePrint + Math.ceil(Math.max(0, formData.branding.stickerCups - pc.stickerBaseCups) / pc.stickerExtraCupStep) * pc.stickerExtraPerStep
            : 0,
          sleevePrice: formData.branding.cupCustomization === "sleeves"
            ? pc.sleeveDesignFee + pc.sleeveBasePrint + Math.ceil(Math.max(0, formData.branding.sleeveCups - pc.sleeveBaseCups) / pc.sleeveExtraCupStep) * pc.sleeveExtraPerStep
            : 0,
          cartPrice: pc.cartBrandingOptions[formData.branding.cartBranding] || 0
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
            <p className="text-sm uppercase tracking-widest opacity-60 mb-1">Estimated Cost</p>
            <p className="text-5xl font-bold">${calculatedCost}</p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 opacity-60 hover:opacity-100 transition-opacity" data-testid="button-start-over">
            Start Over
          </button>
        </motion.div>
      </div>
    );
  }

  const hourOptions = Object.entries(pc.hourlyPricing)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([hours, price]) => ({ val: hours, label: `${hours} Hours (+$${price})` }));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-4 md:py-12 px-4 md:px-6 overflow-x-hidden">
      <div className="md:hidden w-full mb-4 px-2">
        <img src={Untitled_1} alt="Grind Theory" className="h-10 mx-auto" />
      </div>
      <div className="hidden md:block w-full max-w-5xl mb-8">
        <CircularProgress currentStep={step} totalSteps={displaySteps} className="scale-100" />
      </div>
      <div className="w-full flex-1 md:flex-none max-w-5xl md:min-h-[600px] bg-card rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-card-border/30 md:border-card-border/50">
        
        <div 
          className="w-full md:w-5/12 bg-cover bg-center h-32 md:h-auto shrink-0 rounded-t-2xl md:rounded-none"
          style={{ backgroundImage: `url(${stockImage})` }}
        />

        <div className="w-full md:w-7/12 px-5 py-4 md:p-10 flex flex-col text-card-foreground relative flex-1">
          
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
                      data-testid="input-full-name"
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
                      data-testid="input-mobile"
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
                    {pc.basePackageItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-base md:text-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 space-y-6">
                  <label className="flex items-center gap-3 p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none" data-testid="checkbox-addon">
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
                      <span className="text-sm opacity-60">+${pc.basePackagePrice.toFixed(2)} Flat Fee</span>
                    </div>
                  </label>

                  <div className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Guest Count:</p>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                        data-testid="select-guest-count"
                      >
                        {Object.entries(pc.guestModifiers).map(([range, pct]) => (
                          <option key={range} value={range} className="bg-[#6B5E51]">
                            {range} (+{pct}%)
                          </option>
                        ))}
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
                  {hourOptions.map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setFormData({ ...formData, hours: opt.val })}
                      data-testid={`button-hours-${opt.val}`}
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
                    data-testid="button-hours-custom"
                    className={`w-full py-4 rounded-xl md:rounded-2xl text-xl font-medium border transition-all ${
                      formData.hours === "custom" 
                        ? "bg-white text-[#6B5E51] border-white shadow-lg" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Custom ({pc.customHoursMin}+ Hours)
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
                      min={pc.customHoursMin}
                      placeholder="Enter number of hours"
                      data-testid="input-custom-hours"
                      className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                      value={formData.customHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, customHours: e.target.value }))}
                    />
                    <p className="text-sm opacity-60 mt-2 ml-2">Charged at ${pc.customHoursBase} + ${pc.customHoursExtra} per extra hour</p>
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
                      data-testid={`button-event-${type}`}
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
                  {pc.signatureDrinksList.map((drink) => (
                    <div key={drink} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                      <span className="flex-1 mr-4 text-[14px]">{drink}</span>
                      <div className="flex items-center gap-2 md:gap-4 bg-white/10 rounded-lg md:rounded-xl px-1.5 md:px-2 py-1">
                        <button 
                          onClick={() => updateDrinkQuantity('signature', drink, -1)}
                          className="p-0.5 md:p-1 hover:bg-white/20 rounded-md md:rounded-lg transition-colors"
                          data-testid={`button-sig-minus-${drink}`}
                        >
                          <Minus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          className="bg-transparent text-lg md:text-xl font-bold w-8 md:w-12 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={formData.signatureDrinks[drink] || 0}
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
                          data-testid={`button-sig-plus-${drink}`}
                        >
                          <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm opacity-60 text-center mt-4">Each signature drink adds ${pc.signatureDrinkPrice.toFixed(2)} to the quote</p>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 6} direction={direction}>
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-bold">Custom Upgrade</h1>
                <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  <section className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Matcha Upgrade:</p>
                    {Object.entries(pc.matchaOptions).map(([drink, price]) => (
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
                            value={formData.matchaUpgrade[drink] || 0}
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
                    <p className="text-xs opacity-50 text-right">
                      {Object.entries(pc.matchaOptions).map(([name, price]) => `${name.split(' ')[0]}: +$${price.toFixed(2)}`).join(' | ')}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Machine Canned Beverages Upgrade:</p>
                    <div className="relative">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-6 py-4 text-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                        value={formData.cannedBeverages}
                        onChange={(e) => setFormData({ ...formData, cannedBeverages: e.target.value })}
                        data-testid="select-canned"
                      >
                        {pc.cannedOptions.map(opt => (
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
                        <span className="text-sm opacity-60">${pc.bakedGoodsPerItem.toFixed(2)} per pastry</span>
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

                    <label className="flex items-center gap-4 p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none" data-testid="checkbox-bulk-baked">
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
                        <span className="text-xl font-bold">{pc.bakedGoodsBulkCount} Pastries Bulk Pack</span>
                        <span className="text-sm opacity-60">${pc.bakedGoodsBulkPrice.toFixed(2)} Flat Fee</span>
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
                            setFormData(prev => ({ ...prev, alternativeMilk: Math.max(0, val) }));
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
                    <p className="text-xs opacity-50 text-right">Pricing based on event duration (+${pc.altMilkExtraPerHour} per tier)</p>
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
                        data-testid="select-cup-customization"
                      >
                        <option value="none" className="bg-[#6B5E51]">None</option>
                        <option value="stickers" className="bg-[#6B5E51]">Custom stickers on cups ${pc.stickerDesignFee} design fee</option>
                        <option value="sleeves" className="bg-[#6B5E51]">Custom cup sleeves ${pc.sleeveDesignFee} design fee</option>
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
                          <span className="text-xs md:text-sm opacity-60">Base {formData.branding.cupCustomization === "stickers" ? pc.stickerBaseCups : pc.sleeveBaseCups} cups</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 md:gap-6 bg-white/10 rounded-lg md:rounded-2xl py-2 md:py-3 px-4 md:px-6">
                          <button 
                            onClick={() => {
                              const field = formData.branding.cupCustomization === "stickers" ? "stickerCups" : "sleeveCups";
                              const baseCups = formData.branding.cupCustomization === "stickers" ? pc.stickerBaseCups : pc.sleeveBaseCups;
                              const step = formData.branding.cupCustomization === "stickers" ? pc.stickerExtraCupStep : pc.sleeveExtraCupStep;
                              setFormData(prev => ({
                                ...prev,
                                branding: { 
                                  ...prev.branding, 
                                  [field]: Math.max(baseCups, prev.branding[field as 'stickerCups' | 'sleeveCups'] - step) 
                                }
                              }));
                            }}
                            className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg md:rounded-xl transition-colors"
                          >
                            <Minus className="w-5 h-5 md:w-6 md:h-6" />
                          </button>
                          <input
                            type="number"
                            min={formData.branding.cupCustomization === "stickers" ? pc.stickerBaseCups : pc.sleeveBaseCups}
                            step={formData.branding.cupCustomization === "stickers" ? pc.stickerExtraCupStep : pc.sleeveExtraCupStep}
                            className="bg-transparent text-2xl md:text-3xl font-bold w-20 md:w-24 text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={formData.branding.cupCustomization === "stickers" ? formData.branding.stickerCups : formData.branding.sleeveCups}
                            onChange={(e) => {
                              const baseCups = formData.branding.cupCustomization === "stickers" ? pc.stickerBaseCups : pc.sleeveBaseCups;
                              const val = Math.max(baseCups, parseInt(e.target.value) || baseCups);
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
                              const step = formData.branding.cupCustomization === "stickers" ? pc.stickerExtraCupStep : pc.sleeveExtraCupStep;
                              setFormData(prev => ({
                                ...prev,
                                branding: { 
                                  ...prev.branding, 
                                  [field]: prev.branding[field as 'stickerCups' | 'sleeveCups'] + step 
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
                            ? `${pc.stickerBaseCups} cups adds $${pc.stickerBasePrint}, then $${pc.stickerExtraPerStep} per ${pc.stickerExtraCupStep} extra` 
                            : `${pc.sleeveBaseCups} cups adds $${pc.sleeveBasePrint}, then $${pc.sleeveExtraPerStep} per ${pc.sleeveExtraCupStep} extra`}
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
                        data-testid="select-cart-branding"
                      >
                        <option value="none" className="bg-[#6B5E51]">None</option>
                        {Object.entries(pc.cartBrandingOptions).map(([name, price]) => (
                          <option key={name} value={name} className="bg-[#6B5E51]">
                            {name.charAt(0).toUpperCase() + name.slice(1)} ${price}
                          </option>
                        ))}
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
                    <li className="flex justify-between"><span className="opacity-70">Event package:</span> <span>{formData.hasAddon ? `Base Package (+$${pc.basePackagePrice})` : "Not selected"}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Guest count:</span> <span>{formData.guestCount}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Number of hours:</span> <span>{formData.hours === "custom" ? `${formData.customHours} hours` : `${formData.hours} hours`}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Event type:</span> <span>{formData.eventType || "Not selected"}</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Signature drinks:</span> <span>{Object.values(formData.signatureDrinks).reduce((a, b) => a + b, 0)} drinks</span></li>
                    <li className="flex justify-between"><span className="opacity-70">Custom upgrades:</span> <span>
                      {Object.values(formData.matchaUpgrade).reduce((a, b) => a + b, 0)} matcha, {formData.cannedBeverages !== "none" ? `${formData.cannedBeverages} cans` : "No cans"}
                    </span></li>
                    <li className="flex justify-between"><span className="opacity-70">Baked Goods Add-ons:</span> <span>
                      {formData.bakedGoods.useBulk ? `${pc.bakedGoodsBulkCount} Bulk Pack` : `${formData.bakedGoods.count} pastries`}
                      {formData.alternativeMilk > 0 ? `, Alt milk x${formData.alternativeMilk}` : ""}
                    </span></li>
                    <li className="flex justify-between"><span className="opacity-70">Branding Upgrades:</span> <span>
                      {formData.branding.cupCustomization !== "none" ? (formData.branding.cupCustomization === "stickers" ? "Stickers" : "Sleeves") : "None"}
                      {formData.branding.cartBranding !== "none" ? `, ${formData.branding.cartBranding}` : ""}
                    </span></li>
                    <li className="flex justify-between text-sm opacity-60"><span>Miscellaneous costs:</span> <span className="text-right">Varies (travel, power, accessibility, extra staff)</span></li>
                  </ul>

                  <div className="p-4 rounded-xl md:rounded-2xl bg-white/10 border border-white/20 text-center mt-4">
                    <p className="text-sm uppercase tracking-widest opacity-60 mb-1">Estimated Cost</p>
                    <p className="text-2xl md:text-3xl font-bold">${calculatedCost} – ${calculatedCost + pc.costRangeBuffer}</p>
                  </div>

                  <label className="flex items-center gap-3 p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all select-none mt-4" data-testid="checkbox-want-email">
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
                        data-testid="input-email"
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

          {step >= 2 && formData.hasAddon && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 md:mt-6 flex items-center justify-between px-4 md:px-5 py-3 rounded-xl md:rounded-2xl bg-white/10 border border-white/15"
              data-testid="running-total"
            >
              <span className="text-sm md:text-base opacity-70 font-medium">Estimated Total</span>
              <span className="text-xl md:text-2xl font-bold">${calculatedCost.toLocaleString()}</span>
            </motion.div>
          )}

          <div className="flex justify-between items-center mt-4 md:mt-8 gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                data-testid="button-back"
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 rounded-xl md:rounded-2xl text-sm md:text-base font-semibold border border-white/20 hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                Back
              </button>
            )}
            <button
              onClick={step === totalSteps ? handleSubmit : handleNext}
              disabled={createSubmission.isPending}
              data-testid={step === totalSteps ? "button-submit" : "button-next"}
              className={`ml-auto flex items-center gap-1.5 md:gap-2 px-6 md:px-8 py-3 rounded-xl md:rounded-2xl text-sm md:text-base font-semibold transition-all ${
                step === totalSteps
                  ? "bg-white text-[#6B5E51] shadow-lg shadow-white/25 hover:shadow-xl"
                  : "bg-white/10 border border-white/20 hover:bg-white/20"
              }`}
            >
              {createSubmission.isPending ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : step === totalSteps ? (
                <>Submit Quote</>
              ) : (
                <>Next <ArrowRight className="w-4 h-4 md:w-5 md:h-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center py-6">
        <img src={grindTheoryLogo} alt="Grind Theory" className="h-8 md:h-10 opacity-60" data-testid="img-grind-theory-logo" />
      </div>
    </div>
  );
}
