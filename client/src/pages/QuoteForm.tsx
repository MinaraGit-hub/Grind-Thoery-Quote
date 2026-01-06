import { useState, useMemo } from "react";
import { useSettings, useCreateSubmission } from "@/hooks/use-form-data";
import { CircularProgress } from "@/components/CircularProgress";
import { FormStep } from "@/components/FormStep";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, Loader2, Check, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Untitled-1_1767674078681.png";
import stockImage from "@assets/stock_images/professional_mobile__d61a4839.jpg";

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
    alternativeMilk: 0
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const createSubmission = useCreateSubmission();
  const { toast } = useToast();

  const totalSteps = 8; 
  const displaySteps = 8; 

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
      if (isNaN(h) || h < 5) baseCost = 0;
      else baseCost = 1450 + (h - 5) * 200;
    } else if (formData.hours) {
      const specificRate = settings.hourlyRates[formData.hours as keyof typeof settings.hourlyRates];
      baseCost = specificRate || (settings.baseRate * (parseInt(formData.hours) || 0));
    }
    
    // Apply event surplus
    const surplusPercent = settings.eventSurplus?.[formData.eventType] ?? 0;
    let finalCost = Math.round(baseCost * (1 + surplusPercent / 100));
    
    if (formData.hasAddon) {
      finalCost += 650;
    }

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

    // Add Alternative milk: $40 flat for every 2-hour added
    if (!isNaN(hoursNum) && hoursNum > 0) {
      const altMilkIncrements = Math.floor(hoursNum / 2);
      finalCost += formData.alternativeMilk * (altMilkIncrements * 40);
    }
    
    return finalCost;
  }, [settings, formData, cannedOptions]);

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
        signatureDrinks: formData.signatureDrinks,
        matchaUpgrade: formData.matchaUpgrade,
        cannedBeverages: formData.cannedBeverages,
        bakedGoods: formData.bakedGoods,
        alternativeMilk: formData.alternativeMilk,
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
    <div className="min-h-screen bg-background flex flex-col items-center py-0 md:py-12 px-0 md:px-6 overflow-x-hidden">
      {/* Progress Bar - Desktop Only */}
      <div className="hidden md:block w-full max-w-5xl mb-12">
        <CircularProgress currentStep={step} totalSteps={displaySteps} className="scale-100" />
      </div>

      {/* Main Container: Full screen on mobile, limited on desktop */}
      <div className="w-full max-w-5xl md:aspect-[16/10] bg-card md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border-0 md:border border-card-border/50 min-h-screen md:min-h-0">
        
        {/* Left Side: Image */}
        <div 
          className="w-full md:w-1/2 bg-cover bg-[center_top] h-48 md:h-auto shrink-0"
          style={{ backgroundImage: `url(${stockImage})` }}
        />

        {/* Right Side: Form Content */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col text-card-foreground relative flex-1">
          
          {/* Mobile Progress Indicator */}
          <div className="md:hidden flex justify-between items-center mb-6">
            <span className="text-sm opacity-60 font-medium uppercase tracking-wider">Step {step} of {displaySteps}</span>
            <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
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
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  />
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 2} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-bold">Event Duration</h1>
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

                <div className="mt-8">
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
                      <span className="text-lg font-medium">Add Premium Package Upgrade</span>
                      <span className="text-sm opacity-60">+$650.00 Flat Fee</span>
                    </div>
                  </label>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 3} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">How many hours?</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {Object.keys(settings?.hourlyRates || {}).map((h) => (
                    <button
                      key={h}
                      onClick={() => setFormData({ ...formData, hours: h })}
                      className={`w-full py-4 rounded-xl md:rounded-2xl text-xl font-medium border transition-all ${
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
                    className={`w-full py-4 rounded-xl md:rounded-2xl text-xl font-medium border transition-all ${
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
                      className="w-full bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-4 text-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
                      value={formData.customHours}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, customHours: val }));
                      }}
                    />
                    <p className="text-sm opacity-60 mt-2 ml-2">Charged at $1,450 + $200 per extra hour</p>
                  </motion.div>
                )}
              </div>
            </FormStep>

            <FormStep isActive={step === 4} direction={direction}>
              <div className="space-y-6 md:space-y-8">
                <h1 className="text-3xl md:text-4xl font-bold">What type of event is it?</h1>
                <div className="grid grid-cols-1 gap-3 max-h-[400px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(settings?.eventSurplus || {}).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, eventType: type })}
                      className={`w-full py-4 rounded-xl md:rounded-2xl text-lg font-medium border transition-all ${
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
                <div className="space-y-3 max-h-[400px] md:max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(formData.signatureDrinks).map((drink) => {
                    if (drink === "Iced dirty matcha" && formData.eventType !== "Matcha") return null; 
                    
                    return (
                      <div key={drink} className="flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-lg flex-1 mr-4">{drink}</span>
                        <div className="flex items-center gap-4 bg-white/10 rounded-xl px-2 py-1">
                          <button 
                            onClick={() => updateDrinkQuantity('signature', drink, -1)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="text-xl font-bold w-6 text-center">{formData.signatureDrinks[drink]}</span>
                          <button 
                            onClick={() => updateDrinkQuantity('signature', drink, 1)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Plus className="w-5 h-5" />
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
                <div className="space-y-6 max-h-[400px] md:max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  <section className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Matcha Upgrade</p>
                    {Object.keys(formData.matchaUpgrade).map((drink) => (
                      <div key={drink} className="flex items-center justify-between p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                        <span className="text-lg flex-1 mr-4">{drink}</span>
                        <div className="flex items-center gap-4 bg-white/10 rounded-xl px-2 py-1">
                          <button 
                            onClick={() => updateDrinkQuantity('matcha', drink, -1)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="text-xl font-bold w-6 text-center">{formData.matchaUpgrade[drink]}</span>
                          <button 
                            onClick={() => updateDrinkQuantity('matcha', drink, 1)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs opacity-50 text-right">Standard: +$7.00 | Specialty: +$11.00</p>
                  </section>

                  <section className="space-y-3">
                    <p className="text-lg font-semibold opacity-70">Machine Canned Beverages</p>
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
                      <div className="flex items-center justify-center gap-6 bg-white/10 rounded-xl md:rounded-2xl py-3 px-6">
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, bakedGoods: { ...prev.bakedGoods, count: Math.max(0, prev.bakedGoods.count - 1), useBulk: false } }))}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <span className="text-3xl font-bold w-12 text-center">{formData.bakedGoods.useBulk ? 0 : formData.bakedGoods.count}</span>
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, bakedGoods: { ...prev.bakedGoods, count: prev.bakedGoods.count + 1, useBulk: false } }))}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <Plus className="w-6 h-6" />
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
                    <div className="flex items-center justify-between p-6 rounded-xl md:rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-lg font-medium">Cost /2hrs</span>
                      <div className="flex items-center gap-6 bg-white/10 rounded-xl md:rounded-2xl py-3 px-6">
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, alternativeMilk: Math.max(0, prev.alternativeMilk - 1) }))}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <span className="text-3xl font-bold w-12 text-center">{formData.alternativeMilk}</span>
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, alternativeMilk: prev.alternativeMilk + 1 }))}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs opacity-50 text-right">+$40.00 flat for every 2-hour increment</p>
                  </section>
                </div>
              </div>
            </FormStep>

            <FormStep isActive={step === 8} direction={direction}>
              <div className="space-y-8 text-center py-12">
                <h1 className="text-4xl font-bold">Ready to submit?</h1>
                <p className="text-xl opacity-80">Click the button below to receive your instant quote.</p>
              </div>
            </FormStep>
          </div>

          {/* Bottom Control Bar */}
          <div className="mt-auto pt-8 space-y-6">
            <div className="flex justify-center">
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

            <div className="flex items-center gap-4 pb-8 md:pb-0">
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
      </div>

      {/* Logo at Bottom - Desktop Only */}
      <div className="hidden md:block mt-12 opacity-80 max-w-[200px]">
        <img src={logoImg} alt="grind theory logo" className="w-full h-auto" />
      </div>
    </div>
  );
}
